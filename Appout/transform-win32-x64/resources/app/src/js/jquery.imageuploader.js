/*
 * Â©2016 Quicken Loans Inc. All rights reserved.
 */
/* global jQuery FormData FileReader */
(function ($) {
  $('#progress-control').hide();  //隐藏进度条
    $.fn.uploader = function (options, testMode) {
        return this.each(function (index) {
            options = $.extend({
                submitButtonCopy: 'Upload Selected Files',
                instructionsCopy: 'Drag and Drop, or',
                furtherInstructionsCopy: 'Your can also drop more files, or',
                selectButtonCopy: 'Select File',
                secondarySelectButtonCopy: 'Select More Files',
                dropZone: $(this),
                fileTypeWhiteList: ['rdf'],
                badFileTypeMessage: 'Sorry, we\'re unable to accept this type of file.',
                ajaxUrl: '/ajax/upload',
                testMode: false
            }, options);

            var state = {
                fileBatch: [],
                isUploading: false,
                isOverLimit: false,
                listIndex: 0
            };

            // create DOM elements
            var dom = {
                uploaderBox: $(this),
                submitButton: $('<button class="js-uploader__submit-button uploader__submit-button uploader__hide">' +
                    options.submitButtonCopy + '<i class="js-uploader__icon fa fa-upload uploader__icon"></i></button>'),
                instructions: $('<p class="js-uploader__instructions uploader__instructions">' +
                    options.instructionsCopy + '</p>'),
                selectButton: $('<input style="height: 0; width: 0;" id="fileinput' + index + '" type="file" multiple class="js-uploader__file-input uploader__file-input">' +
                    '<label for="fileinput' + index + '" style="cursor: pointer;" class="js-uploader__file-label uploader__file-label">' +
                    options.selectButtonCopy + '</label>'),
                secondarySelectButton: $('<input style="height: 0; width: 0;" id="secondaryfileinput' + index + '" type="file"' +
                    ' multiple class="js-uploader__file-input uploader__file-input">' +
                    '<label for="secondaryfileinput' + index + '" style="cursor: pointer;" class="js-uploader__file-label uploader__file-label uploader__file-label--secondary">' +
                    options.secondarySelectButtonCopy + '</label>'),
                fileList: $('<ul class="js-uploader__file-list uploader__file-list"></ul>'),
                contentsContainer: $('<div class="js-uploader__contents uploader__contents"></div>'),
                furtherInstructions: $('<p class="js-uploader__further-instructions uploader__further-instructions uploader__hide">' + options.furtherInstructionsCopy + '</p>')
            };

            // empty out whatever is in there
            dom.uploaderBox.empty();

            // create and attach UI elements
            setupDOM(dom);

            // set up event handling
            bindUIEvents();

            function setupDOM (dom) {
                dom.contentsContainer
                    .append(dom.instructions)
                    .append(dom.selectButton);
                // dom.furtherInstructions
                //     .append(dom.secondarySelectButton);
                dom.uploaderBox
                    .append(dom.fileList)
                    .append(dom.contentsContainer)
                    .append(dom.submitButton)
                    .after(dom.furtherInstructions);
            }

            function reSetupDOM(dom) {
              dom.contentsContainer
                .append(dom.instructions)
                .append(dom.selectButton);
              // dom.furtherInstructions
              //     .append(dom.secondarySelectButton);
              // var id = 0;
              dom.fileList.find('li').remove();
              dom.uploaderBox
                .append(dom.fileList)
                .append(dom.contentsContainer)
                .append(dom.submitButton)
                .after(dom.furtherInstructions);
              dom.submitButton.addClass('uploader__hide');
              // dom.furtherInstructions.addClass('uploader__hide');
              dom.contentsContainer.removeClass('uploader__hide');
            }
            function bindUIEvents () {
                // handle drag and drop
                options.dropZone.on('dragover dragleave', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
                $.event.props.push('dataTransfer'); // jquery bug hack
                options.dropZone.on('drop', selectFilesHandler);

                // hack for being able selecting the same file name twice
                dom.selectButton.on('click', function () { this.value = null; });
                dom.selectButton.on('change', selectFilesHandler);
                // dom.secondarySelectButton.on('click', function () { this.value = null; });
                // dom.secondarySelectButton.on('change', selectFilesHandler);

                // handle the submit click
                dom.submitButton.on('click', uploadSubmitHandler);

                // remove link handler
                dom.uploaderBox.on('click', '.js-upload-remove-button', removeItemHandler);

                // expose handlers for testing
                if (options.testMode) {
                    options.dropZone.on('uploaderTestEvent', function (e) {
                        switch (e.functionName) {
                        case 'selectFilesHandler':
                            selectFilesHandler(e);
                            break;
                        case 'uploadSubmitHandler':
                            uploadSubmitHandler(e);
                            break;
                        default:
                            break;
                        }
                    });
                }
            }

            function addItem (file) {
                var fileName = cleanName(file.name);
                var fileSize = file.size;
                var id = state.listIndex;
                var sizeWrapper;
                var fileNameWrapper = $('<span class="uploader__file-list__text">' + fileName + '</span>');

                state.listIndex++;

                var listItem = $('<li class="uploader__file-list__item" data-index="' + id + '"></li>');
                var thumbnailContainer = $('<span class="uploader__file-list__thumbnail"></span>');
                var thumbnail = $('<img class="thumbnail"><i class="fa fa-spinner fa-spin uploader__icon--spinner"></i>');
                var removeLink = $('<span class="uploader__file-list__button"><button class="uploader__icon-button js-upload-remove-button fa fa-times" data-index="' + id + '"></button></span>');

                // validate the file
                if (options.fileTypeWhiteList.indexOf(getExtension(file.name).toLowerCase()) !== -1) {
                    // file is ok, add it to the batch
                    state.fileBatch.push({file: file, id: id, fileName: fileName, fileSize: fileSize});
                    sizeWrapper = $('<span class="uploader__file-list__size">' + formatBytes(fileSize) + '</span>');
                } else {
                    // file is not ok, only add it to the dom
                    sizeWrapper = $('<span class="uploader__file-list__size"><span class="uploader__error">' + options.badFileTypeMessage + '</span></span>');
                }

                // create the thumbnail, if you can
                if (window.FileReader && file.type.indexOf('image') !== -1) {
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        thumbnail.attr('src', reader.result);
                        thumbnail.parent().find('i').remove();
                    };
                    reader.onerror = function () {
                        thumbnail.remove();
                    };
                    reader.readAsDataURL(file);
                } else if (file.type.indexOf('image') === -1) {
                    thumbnail = $('<i class="fa fa-file-o uploader__icon">');
                }

                thumbnailContainer.append(thumbnail);
                listItem.append(thumbnailContainer);

                listItem
                    .append(fileNameWrapper)
                    .append(sizeWrapper)
                    .append(removeLink);

                dom.fileList.append(listItem);
            }

            function getExtension (path) {
                var basename = path.split(/[\\/]/).pop();
                var pos = basename.lastIndexOf('.');

                if (basename === '' || pos < 1) {
                    return '';
                }
                return basename.slice(pos + 1);
            }

            function formatBytes (bytes, decimals) {
                if (bytes === 0) return '0 Bytes';
                var k = 1024;
                var dm = decimals + 1 || 3;
                var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
                var i = Math.floor(Math.log(bytes) / Math.log(k));
                return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i];
            }

            function cleanName (name) {
                name = name.replace(/\s+/gi, '-'); // Replace white space with dash
                return name.replace(/[^a-zA-Z0-9.\-]/gi, ''); // Strip any special characters
            }

            function uploadSubmitHandler () {
                if (state.fileBatch.length !== 0) {
                    //进度条
                  var timer =  window.setInterval(progressAdd,1000);//每隔1min调用一次show函数, 防止用户以为卡死
                  $('#progress-control').show();
                  $('#progress-bar-transform').css('width', '1%');
                  $('#progress-bar-transform').text('1%');
                  $('#status').text("transform...");

                    var data = new FormData();
                    for (var i = 0; i < state.fileBatch.length; i++) {
                        data.append('files[]', state.fileBatch[i].file, state.fileBatch[i].fileName);
                    }
                  var zerorpc = require("zerorpc");

                  var client = new zerorpc.Client({timeout:3600*24, heartbeatInterval: 3600*24*1000});
                  client.connect("tcp://127.0.0.1:42142");
                    //calls the method on the python object
                  var path_length = state.fileBatch[0].file["path"].length;
                  var file_length = state.fileBatch[0].fileName.length;
                  var file_path = state.fileBatch[0].file["path"].substring(0, path_length-file_length);
                  client.invoke("hello", state.fileBatch[0].file["path"], file_path, state.fileBatch[0].fileName, function(error, reply, streaming) {
                    $('#progress-bar-transform').css('width', '100%');
                    $('#progress-bar-transform').text('100%');
                    dom.uploaderBox.empty();
                    reSetupDOM(dom);
                    bindUIEvents();
                    $('#progress-bar-transform').css('width', '0%');
                    $('#progress-bar-transform').text('');
                    $('#progress-control').hide();
                    if(error){
                      console.log("ERROR: ", error);
                    }
                    console.log(reply);
                  });
                    // $.ajax({
                    //     type: 'POST',
                    //     url: options.ajaxUrl,
                    //     data: data,
                    //     cache: false,
                    //     contentType: false,
                    //     processData: false
                    // });
                }
            }

            function selectFilesHandler (e) {
                e.preventDefault();
                e.stopPropagation();

                if (!state.isUploading) {
                    // files come from the input or a drop
                    var files = e.target.files || e.dataTransfer.files || e.dataTransfer.getData;

                    // process each incoming file
                    for (var i = 0; i < files.length; i++) {
                        addItem(files[i]);
                    }
                }
                renderControls();
            }

            function renderControls () {
                if (dom.fileList.children().size() !== 0) {
                    dom.submitButton.removeClass('uploader__hide');
                    // dom.furtherInstructions.removeClass('uploader__hide');
                    dom.contentsContainer.addClass('uploader__hide');
                } else {
                    dom.submitButton.addClass('uploader__hide');
                    // dom.furtherInstructions.addClass('uploader__hide');
                    dom.contentsContainer.removeClass('uploader__hide');
                }
            }

            function removeItemHandler (e) {
                e.preventDefault();

                if (!state.isUploading) {
                    var removeIndex = $(e.target).data('index');
                    removeItem(removeIndex);
                    $(e.target).parent().remove();
                }

                renderControls();
            }

            function removeItem (id) {
                // remove from the batch
                for (var i = 0; i < state.fileBatch.length; i++) {
                    if (state.fileBatch[i].id === parseInt(id)) {
                        state.fileBatch.splice(i, 1);
                        break;
                    }
                }
                // remove from the DOM
                dom.fileList.find('li[data-index="' + id + '"]').remove();
            }
        });
    };
}(jQuery));

//伪进度条
function progressAdd() {
  var result_width = GetProgressWidth($('#progress-bar-transform'));
  if (result_width < 99){
    $('#progress-bar-transform').css('width', ++result_width[0] + '%');
    $('#progress-bar-transform').text(result_width[0] + '%');
  }
}

function GetProgressWidth(selector) {
  var width = selector[0].style.width;
  var reg = /\d+/g;
  var result_width = width.match(reg);
  return result_width;
}
