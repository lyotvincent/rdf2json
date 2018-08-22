$('.convert').click(function () {
  $('.Transformation').addClass('active');
  $('.Transformation > .icon').addClass('active');
  $('.about').removeClass('active');
  $('.wrap').removeClass('active');
  $('.ship').removeClass('active');
  $('.about > .icon').removeClass('active');
  $('.wrap > .icon').removeClass('active');
  $('.ship > .icon').removeClass('active');
  // $('#line').addClass('one');
  // $('#line').removeClass('two');
  // $('#line').removeClass('three');
  // $('#line').removeClass('four');
  $('#line').addClass('two');
  $('#line').removeClass('one');
  $('#line').removeClass('three');
  $('#line').removeClass('four');
});
$('.about').click(function () {
  $('.about').addClass('active');
  $('.about > .icon').addClass('active');
  $('.Transformation').removeClass('active');
  $('.wrap').removeClass('active');
  $('.ship').removeClass('active');
  $('.Transformation > .icon').removeClass('active');
  $('.wrap > .icon').removeClass('active');
  $('.ship > .icon').removeClass('active');
  // $('#line').addClass('two');
  // $('#line').removeClass('one');
  // $('#line').removeClass('three');
  // $('#line').removeClass('four');
  $('#line').addClass('three');
  $('#line').removeClass('two');
  $('#line').removeClass('one');
  $('#line').removeClass('four');
});
// $('.home').click(function () {
//   $('.home').addClass('active');
//   $('.convert').removeClass('active');
//   $('.about').removeClass('active');
//   $('#line').addClass('one');
//   $('#line').removeClass('two');
//   $('#line').removeClass('three');
// });
// $('.convert').click(function () {
//   $('.convert').addClass('active');
//   $('.home').removeClass('active');
//   $('.about').removeClass('active');
//   $('#line').addClass('two');
//   $('#line').removeClass('one');
//   $('#line').removeClass('three');
// });
// $('.about').click(function () {
//   $('.about').addClass('active');
//   $('.convert').removeClass('active');
//   $('.home').removeClass('active');
//   $('#line').addClass('three');
//   $('#line').removeClass('two');
//   $('#line').removeClass('one');
// });
$('.home').click(function () {
  $('#first').addClass('active');
  $('#second').removeClass('active');
  $('#third').removeClass('active');
  $('#fourth').removeClass('active');
});
$('.convert').click(function () {
  $('#first').removeClass('active');
  $('#second').addClass('active');
  $('#third').removeClass('active');
  $('#fourth').removeClass('active');
});
$('.about').click(function () {
  $('#first').removeClass('active');
  $('#second').removeClass('active');
  $('#third').addClass('active');
  $('#fourth').removeClass('active');
});
var zerorpc = require("zerorpc");
var client = new zerorpc.Client({ timeout: 3600*24, heartbeatInterval: 3600*1000*24});
client.connect("tcp://127.0.0.1:42142");
client.invoke("train", (error, res) =>{
  if(error) {
    console.log(error);
  } else {
    console.log('success');
  }
})
