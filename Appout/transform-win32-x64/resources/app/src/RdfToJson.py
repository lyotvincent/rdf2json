from rdflib import *
import time
import json
import datetime
import zerorpc


class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.strftime('%Y-%m-%d %H:%M:%S')
        elif isinstance(obj, datetime.date):
            return obj.strftime("%Y-%m-%d")
        else:
            return json.JSONEncoder.default(self, obj)


class RdfToJson():

    def rdfdemo(self, full_path, path, file_name):
        with open(full_path, "r", encoding='utf-8') as f:
            resources = dict()
            rdf_ids = dict()
            # self.g = ConjunctiveGraph().parse(f, format="nquads")
            self.g = Graph().parse(f, format="application/rdf+xml")
            subjects = set(self.g.subjects())
            # for stmt in self.g:
            #     print(stmt[0], stmt[1], stmt[2])
            # print('************************************************************')
            i = 0
            resources["namespaces"] = self.get_namespaces()
            for subject in subjects:
                is_rdfid = False
                #print(i)
                #i += 1
                properties = dict()
                if isinstance(subject, BNode):
                    continue
                else:
                    i += 1
                # print(stmt[0], stmt[1], stmt[2])
                # subject_qname = self.g.qname(subject)
                for tup in self.g.predicate_objects(subject):
                    tmp = dict()
                    # property_name = ""
                    # property_tup = self.g.compute_qname(tup[0])
                    # if property_tup[0] == "ns1":
                    #     property_name = property_tup[2]
                    # else:
                    property_name = self.g.qname(tup[0])
                    if isinstance(tup[1], Literal):
                        if str(Literal(tup[1]).value) == 'nan':
                            tmp["value"] = ''
                        else:
                            tmp["value"] = Literal(tup[1]).value
                        #tmp["value"] = Literal(tup[1]).value
                        #tmp["type"] = "literal"
                        state = Literal(tup[1]).__getstate__()[1]
                        if state["language"] is not None:
                            tmp["lang"] = state["language"]
                        if state["datatype"] is not None:
                            tmp["datatype"] = state["datatype"].toPython()
                        if property_name in properties.keys():
                            re_val = properties.get(property_name)
                            if type(re_val).__name__ == 'dict':
                                properties[property_name] = [re_val, tmp]
                            elif type(re_val).__name__ == 'list':
                                re_val.append(tmp)
                                properties[property_name] = re_val
                        else:
                            properties[property_name] = tmp
                    elif isinstance(tup[1], URIRef):
                        tmp["rdf:resource"] = URIRef(tup[1]).toPython()
                        #tmp["type"] = "url"
                        if property_name == "rdf:subject":
                            is_rdfid = True
                        if property_name in properties.keys():
                            re_val = properties.get(property_name)
                            if type(re_val).__name__ == 'dict':
                                properties[property_name] = [re_val, tmp]
                            elif type(re_val).__name__ == 'list':
                                re_val.append(tmp)
                                properties[property_name] = re_val
                        else:
                            properties[property_name] = tmp
                    elif isinstance(tup[1], BNode):
                        # print(self.g.all_nodes()[tup[1]])
                        print(tup[1])
                        is_collection = False
                        for tup1 in self.g.predicate_objects(tup[1]):
                            if str(tup1[0]).endswith("#first") or str(tup1[0]).endswith("#rest"):
                                is_collection = True
                        if is_collection is False:
                            properties[property_name] = self.process_general_BNode(tup[1])
                        else:
                            properties[property_name] = self.process_general_Collection(tup[1])
                        #properties[str(tup[0])] = self.process_general_BNode(tup[1])
                if not is_rdfid:
                    resources[str(subject)] = properties
                else:
                    rdf_ids[str(subject)] = properties
            #deal with the rdf:ID
            for item in rdf_ids.items():
                id = item[0]
                id_qname = self.g.qname(URIRef(id))
                content = item[1]
                sub = content["rdf:subject"]["rdf:resource"]
                pre = content["rdf:predicate"]["rdf:resource"]
                if 'rdf:resource' in content["rdf:object"].keys():
                    obj = content["rdf:object"]["rdf:resource"]
                else:
                    obj = content["rdf:object"]["value"]
                pre_qname = self.g.qname(URIRef(pre))
                if sub in resources.keys():
                    objs = resources[sub][pre_qname]
                    if type(objs).__name__ == "dict":
                        objs["rdfID"] = id_qname
                    if type(objs).__name__ == "list":
                        for j in range(len(objs)):
                            if 'rdf:resource' in objs[j].keys():
                                if objs[j]["rdf:resource"] == obj:
                                    objs[j]["rdfID"] = id_qname
                            else:
                                if objs[j]["value"] == obj:
                                    objs[j]["rdfID"] = id_qname
                    resources[sub][pre_qname] = objs
                else:
                    objs = rdf_ids[sub][pre_qname]
                    if type(objs).__name__ == "dict":
                        objs["rdfID"] = id_qname
                    if type(objs).__name__ == "list":
                        for j in range(len(objs)):
                            if 'rdf:resource' in objs[j].keys():
                                if objs[j]["rdf:resource"] == obj:
                                    objs[j]["rdfID"] = id_qname
                            else:
                                if objs[j]["value"] == obj:
                                    objs[j]["rdfID"] = id_qname
                    rdf_ids[sub][pre_qname] = objs
                content.pop("rdf:subject")
                content.pop("rdf:predicate")
                content.pop("rdf:object")
                resources[id] = content
            fp = open(path+file_name+'_result.json', 'w')
            json.dump(resources, fp, cls=DateEncoder)
            fp.close()
            print('finished!')

    #namespace的实现，把URI的前缀提取出来
    def get_namespaces(self):
        namespace_map = dict()
        for name_tuple in self.g.namespaces():
            namespace_map[name_tuple[0]] = name_tuple[1].toPython()

        return namespace_map

    def process_general_BNode(self, node_id):
        properties = dict()
        container_type = ""
        for tup in self.g.predicate_objects(node_id):
            tmp = dict()
            property_name = self.g.qname(tup[0])
            if isinstance(tup[1], Literal):
                if str(Literal(tup[1]).value) == 'nan':
                    tmp["value"] = ''
                else:
                    tmp["value"] = Literal(tup[1]).value
                # tmp["type"] = "literal"
                state = Literal(tup[1]).__getstate__()[1]
                if state["language"] is not None:
                    tmp["lang"] = state["language"]
                if state["datatype"] is not None:
                    tmp["datatype"] = state["datatype"].toPython()
                properties[property_name] = tmp
            elif isinstance(tup[1], URIRef):
                if tup[1] == RDF.Seq:
                    container_type = "Seq"
                elif tup[1] == RDF.Alt:
                    container_type = "Alt"
                elif tup[1] == RDF.List:
                    container_type = "List"
                elif tup[1] == RDF.Bag:
                    container_type = "Bag"
                tmp["rdf:resource"] = URIRef(tup[1]).toPython()
                # tmp["type"] = "url"
                properties[property_name] = tmp
            elif isinstance(tup[1], BNode):
                properties[property_name] = self.process_general_BNode(tup[1])
        if container_type is not "":
            container_properties = dict()
            container_properties["container"] = container_type
            # properties.pop(str(RDF.type))
            properties.pop("rdf:type")
            container_properties["value"] = properties
            return container_properties
        return properties


    def process_general_Collection(self, node_id):
        properties = dict()
        properties["type"] = "collection"
        collection = []
        collection = self.general_each_item(collection, node_id)
        properties["value"] = collection

        return properties

    def general_each_item(self, collection, node_id):
        print(collection)
        print("################################")
        for tup in self.g.predicate_objects(node_id):

            tmp = dict()
            if isinstance(tup[1], Literal):
                if str(Literal(tup[1]).value) == 'nan':
                    tmp["value"] = ''
                else:
                    tmp["value"] = Literal(tup[1]).value
                # tmp["type"] = "url"
                state = Literal(tup[1]).__getstate__()[1]
                if state["language"] is not None:
                    tmp["lang"] = state["language"]
                if state["datatype"] is not None:
                    tmp["datatype"] = state["datatype"].toPython()
                collection.append(tmp)
            elif isinstance(tup[1], URIRef):
                if str(URIRef(tup[1]).toPython()).endswith("#nil"):
                    continue
                tmp["rdf:resource"] = URIRef(tup[1]).toPython()
                # tmp["type"] = "url"
                collection.append(tmp)
            elif isinstance(tup[1], BNode):
                is_collection = False
                for tup1 in self.g.predicate_objects(tup[1]):
                    if str(tup1[0]).endswith("#first") or str(tup1[0]).endswith("#rest"):
                        is_collection = True
                if is_collection is False:
                    collection.append(self.process_general_BNode(tup[1]))
                else:
                    collection = self.general_each_item(collection, tup[1])
        return collection

    def hello(self, full_path, path, file_name):
        fi = file_name.split('.')[0]
        self.rdfdemo(full_path, path, fi)
        return fi


def main():
    s = zerorpc.Server(RdfToJson(), heartbeat=None)
    s.bind("tcp://0.0.0.0:42142")
    s.run()


if __name__ == "__main__" :
    main()
