poderia melhorar a classe abaixo

import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { saveAs } from 'file-saver';
import JSZip from "jszip";



interface OutputFiles {
  file_tree: any
}

class swagger_generator {
  constructor() { }


}

@Injectable({
  providedIn: 'root'
})
export class GeradorService {
  swagger_buffer = {}
  dataBaseChange = new BehaviorSubject<any>({ Entidades: {} });
  _dataBaseChange = {};
  updateSwagger(paths: any[], schemas: any) {
    if (schemas) {
      for (const key of Object.keys(schemas)) {
        this._dataBaseChange[key] = schemas[key]
        this.dataBaseChange.next(this._dataBaseChange)
      }
    }
    if (this.checkSwaggerChanges(paths) && this.checkAllowSwaggerChanges()) {
      this.xmlSwaggerUpdate(paths)
      this.swagger_buffer[this.swaggerNodeId] = JSON.parse(JSON.stringify(paths))
    }
  }
  xmlSwaggerUpdate(paths: any[]) {
    const new_swagger = Object.keys(paths);
    var parser = new DOMParser();
    const xml_parsed: any = parser.parseFromString(this.root_xml_str, 'text/xml');
    const root = this.findName(xml_parsed, 'root');
    let exclude_nodes: any[] = []
    let exclude_sub_nodes: any[] = []
    this.findByAttribute(root, 'source', this.swaggerNodeId, exclude_nodes)
    for (const [i, node] of exclude_nodes.entries()) {
      if (node && node.getAttribute('target')) {
        const n = this.findId(root, node.getAttribute('target'));
        if (n)
          n.remove();
      }
      node.remove()
    }
    //this.findId(xml_parsed, id).
    for (const [i, path] of Object.keys(paths).entries()) {
      let path_rote = path.split(',')[1].replace('/' + path.split(',')[1].split('/')[1], '').replace(' ', '');
      path_rote = path_rote == '' ? '/' : path_rote;
      const template1 = `<object label=\"${path}\"   dominio=\"${path.split(',')[1].replace('/', '').replace(' ', '')}\" id="${path.replace(' ', '')}" path="${path_rote}" method="${path.split(',')[0].toUpperCase()}" tipo="apigateway"  ><mxCell   style="whiteSpace=wrap;html=1;rounded=1;arcSize=50;align=center;verticalAlign=middle;strokeWidth=1;autosize=1;spacing=4;treeFolding=1;treeMoving=1;newEdgeStyle={&quot;edgeStyle&quot;:&quot;entityRelationEdgeStyle&quot;,&quot;startArrow&quot;:&quot;none&quot;,&quot;endArrow&quot;:&quot;none&quot;,&quot;segment&quot;:10,&quot;curved&quot;:1};" vertex="1" parent="${this.swaggerNodeId}">
                          <mxGeometry x="110" y="${i * 30}" width="150.5" height="22" as="geometry"/>
                        </mxCell></object>
                        `
      const template2 = `<mxCell id="${path.replace(' ', '')}_cnx" value="" style="edgeStyle=entityRelationEdgeStyle;startArrow=none;endArrow=none;segment=10;curved=1;rounded=0;exitX=1;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=0;" parent="${this.swaggerNodeId}" source="${this.swaggerNodeId}" target="${path.replace(' ', '')}" edge="1">
                          <mxGeometry relative="1" as="geometry">
                            <mxPoint x="78" y="89" as="sourcePoint"/>
                          </mxGeometry>
                        </mxCell>
                        `
      const new_node_path = parser.parseFromString(template1, 'text/xml');
      root.appendChild(new_node_path.childNodes[0])
      const new_node = parser.parseFromString(template2, 'text/xml');
      root.appendChild(new_node.childNodes[0])
    }
    this.root_xml_str = xml_parsed.childNodes[0].outerHTML;
    this.update.next('' + xml_parsed.childNodes[0]['outerHTML'])
  }

  checkSwaggerChanges(paths: any): boolean {
    if (!this.swagger_buffer || !this.swagger_buffer[this.swaggerNodeId])
      this.swagger_buffer[this.swaggerNodeId] = {}

    const old_swagger = Object.keys(this.swagger_buffer[this.swaggerNodeId]);
    const new_swagger = Object.keys(paths);
    for (let index = 0; index < old_swagger.length; index++) {
      if (old_swagger[index] != new_swagger[index])
        return true;

    }
    return old_swagger.length != new_swagger.length;
  }

  checkAllowSwaggerChanges(): boolean {
    if (this.swaggerNodeId && this.swaggerNodeId != "" && this.root_xml_str && this.root_xml_str.includes(this.swaggerNodeId))
      return true;

    return false;
  }

  getSwagger(value: any) {
    if (value[0].style.includes('aws3.api_gateway')) {
      this.swaggerNodeId = value[0].id;
      const ctr = value[0].getAttribute('ctr');
      return ctr ? ctr : "";//JSON.parse(contract);
    }
  }

  parameters: any;

  knownNodes: any[] = [];
  _tree: any;
  update: any = new BehaviorSubject<any>(null);
  tree: any = new BehaviorSubject<any>(null);
  errors: any = new BehaviorSubject<any>(null);
  dataChange = new BehaviorSubject<OutputFiles>({ file_tree: { 'app': { 'data': 1 } } });
  xml = new BehaviorSubject<string>('');
  loading = new BehaviorSubject<boolean>(false);
  loading_value: boolean;
  root: any;
  root_xml: any;
  root_xml_str: any;
  swaggerNodeId: string;



  constructor(private http: HttpClient) { }

  buildApp(xml: any): void {
    this.xml.next(xml);
    this.ngXmlChanges(xml);
  }
  upadateXml(xml: any): void {
    this.xml.next(xml);
    this.root_xml_str = xml;
  }

  ngXmlChanges(changes: any) {
    console.log(changes);
    this.root_xml_str = changes;
    var parser = new DOMParser();
    this._tree = {};
    this.knownNodes = []
    this.root_xml = parser.parseFromString(changes, 'text/xml');
    const root = this.findName(this.root_xml, 'root');
    this.root = root;
    const x = root.childNodes;
    for (let i = 0; i < x.length; i++) {
      let cursor: any = x[i];
      if (cursor.localName == 'object') {
        cursor = x[i].childNodes[0];
        if (x[i].attributes) {
          for (let j = 0; j < x[i].attributes.length; j++) {
            cursor.setAttribute(x[i].attributes[j].name, x[i].attributes[j].value);
          }
        }
      }
      let paramNode: any = this.lookingKnowNodes(cursor)
      if (paramNode) {
        if (!this._tree[paramNode.root])
          this._tree[paramNode.root] = []
        let newNode: any = {};
        newNode[paramNode.name] = this.getNodeInfos(paramNode, cursor, root);
        this._tree[paramNode.root].push(newNode);
      }
    }
    this.postGenerateApp(this._tree);
    this.tree.next(this._tree)
  }
  swagger_generator(id: string): any {
    // montando o swagger
    // busca o swagger base
    const api = this.findId(this.root, id);
    const swagger = api.getAttribute('ctr');
    // busca todos que tem o apigtw como source
    // pra cada um verifica o target
    let path_data: any = {};
    let conexoes: any[] = [];
    this.findByAttribute(this.root, 'source', id, conexoes)
    for (const [i, node] of conexoes.entries()) {
      if (node && node.getAttribute('target')) {
        const n = this.findId(this.root, node.getAttribute('target'));
        const path = n.getAttribute('value') ? n.getAttribute('value') : n.getAttribute('label');
        if (path) {
          //busca conexoes da rota
          let path_connections: any[] = []
          this.findByAttribute(this.root, 'source', n.id, path_connections)
          //so considera o primeiro serviço conectado
          if (path_connections.length > 0) {
            const service_id = path_connections[0].getAttribute('target');
            const service = this.findId(this.root, service_id);
            let target_path: any = this.lookingKnowNodes(service);
            let service_obj = this.getNodeAttributes(service.attributes, this.root)
            if (service.localName == 'object') {
              service_obj = JSON.parse(JSON.stringify(Object.assign(this.getNodeAttributes(service.attributes, this.root), this.getNodeAttributes(service.childNodes[0].attributes, this.root))))
            }


            if (target_path) {
              path_data[path] = JSON.parse(JSON.stringify(Object.assign(target_path, service_obj)))
            } else {
              path_data[path] = service_obj
            }


          } else {

            path_data[path] = null;
          }
        }
      }
    }
    return path_data;
  }

  fillData(properties: any) {
    if (properties['data']) {
      try {
        const data_node = JSON.parse(properties['data']['v']);
        delete properties['data'];
        properties = { ...data_node, ...properties }

      } catch (error) {
        delete properties['data'];
      }

    }
    return properties;
  }
  getNodeInfos(paramNode: any, arg1: any, tree: any): any {
    let input: any[] = this.getTargetNode(arg1.id, tree);
    let output: any[] = this.getSourceNode(arg1.id, tree);

    let properties = this.getNodeAttributes(arg1.attributes, tree);
    properties['rota_gerador'] = { 'v': paramNode.rota_gerador }
    properties = this.fillData(properties)
    if (paramNode.extra)
      properties['extra'] = this[paramNode.extra](arg1.id)
    return {
      'input': input,
      'output': output,
      'properties': properties
    }
  }

  getSourceNode(id: any, tree: any): any[] {
    let sources: any[] = [];
    //busca conexoes
    let source: any[] = [];
    this.findByAttribute(tree, 'source', id, source);
    for (let i = 0; i < source.length; i++) {
      let targetNode = this.findId(tree, source[i].getAttribute('target'));
      let target: any = this.lookingKnowNodes(targetNode);
      let properties: any = {}
      if (source[i].id) {
        properties = this.getNodeAttributes(source[i].attributes, tree);
      } else {
        properties = this.getNodeAttributes(source[i].parentNode.attributes, tree);
      }
      if (targetNode && targetNode.attributes) {
        let targetProperties = this.getNodeAttributes(targetNode.attributes, tree);
        targetProperties = this.fillData(targetProperties)
        if (!target) {
          try {
            alert(`recurso ${targetProperties['value']['v']},  não reconhecido`)
          } catch (error) {

          }
          properties['target'] = targetProperties;
        }
        else {
          properties['target'] = Object.assign(target, targetProperties);
        }


      }
      if (target) {
        properties['cnx_target'] = { 'v': target.name };
        properties['cnx_target_name'] = { 'v': target.name + '_' + this.getNodeValue(targetNode) };
      }

      sources.push({ 'properties': properties });
    }
    return sources;
  }

  getNodeValue(node: any) {
    if (node.id) {
      return node.getAttribute('value') || node.getAttribute('label')
    } else
      return node.parentNode.getAttribute('value') || node.parentNode.getAttribute('label')
  }

  getNodeAttributes(attributes: any, node: any = null) {
    let result: any = {};
    for (let i = 0; i < attributes.length; i++) {
      if (!'parent-source-style-vertex-target-edge'.includes(attributes[i].name)) {
        if (attributes[i].name == 'label')
          result['value'] = { 'v': attributes[i].value ? attributes[i].value : '(vazio)' };
        else
          result[attributes[i].name] = { 'v': attributes[i].value ? attributes[i].value : '(vazio)' };
      }
    }
    if ((result['value'] == undefined || result['value']['v'] == '(vazio)') && result['id'] !== undefined) {
      let source: any[] = [];
      this.findByAttribute(node, 'parent', result['id']['v'], source);
      if (source[0]) {
        let a = source[0].getAttribute('value');
        result['value'] = { 'v': a };
      }

    }
    return result;
  }

  getTargetNode(id: any, tree: any): any[] {
    let sources: any[] = [];
    //busca conexoes
    let target: any[] = [];
    this.findByAttribute(tree, 'target', id, target);
    for (let i = 0; i < target.length; i++) {
      let source_node = this.findId(tree, target[i].getAttribute('source'));
      if (source_node) {
        let source: any = this.lookingKnowNodes(source_node);
        if (source) {
          let properties: any = {}
          if (target[i].id) {
            properties = this.getNodeAttributes(source_node.attributes, tree);
          } else {
            properties = this.getNodeAttributes(source_node.parentNode.attributes, tree);
          }
          try {
            properties['source'] = source
          } catch (error) {

          }
          properties['cnx_source'] = { 'v': source.name };
          properties = this.fillData(properties)
          sources.push({ properties: properties });
        } else {
          sources.push({ properties: { cnx_source: this.getNodeAttributes(source_node.attributes, tree) } });
        }
      }
    }
    return sources;
  }

  findName(node: any, name: string) {
    if (node.localName == name) {
      return node;
    } else {
      const childs = node.childNodes;
      if (childs.length > 0) {
        for (let i = 0; i < childs.length; i++) {
          const n: any = this.findName(childs[i], name);
          if (n) {
            return n;
          }
        }
      } else {
        return null;
      }
    }
  }

  findShapeInParameters(style: any): any {
    let foundedNode = null;
    this.parameters.forEach((element: any) => {
      let found = false
      for (let index = 0; index < element.matches.length; index++) {
        const match = element.matches[index];
        if (style[match.name] == match.value) {
          found = true;
        }
      }
      if (found)
        foundedNode = element;
      return !found;
    });
    return foundedNode;
  }

  lookingKnowNodes(node: any): any {
    if (!node)
      return;
    if (node.localName == 'object') {
      return this.lookingKnowNodes(node.childNodes[0])
    }
    if (node.getAttribute('style')) {
      let styles: any = {}
      node.getAttribute('style').split(';').every((element: any) => {
        const dict = element.split('=');
        if (dict.length > 1) {
          styles[dict[0]] = dict[1];
        }
        return true;
      });
      return this.findShapeInParameters(styles)
    }
    return false;
  }
  getNode(id: string) {
    var parser = new DOMParser();
    const xml_parsed: any = parser.parseFromString(this.root_xml_str, 'text/xml');
    const root = this.findName(xml_parsed, 'root');
    return this.getNodeAttributes(this.findId(root, id).attributes, root);
  }

  findId(node: any, id: string) {
    if (node == null) {
      node = this.root;
    }
    if (node.id == id) {
      return node;
    } else {
      const childs = node.childNodes;
      if (childs.length > 0) {
        for (let i = 0; i < childs.length; i++) {
          const n: any = this.findId(childs[i], id);
          if (n) {
            return n;
          }
        }
      } else {
        return null;
      }
    }

  }

  findByAttribute(node: any, attributeName: string, attributeValue: string, targets: any[]) {

    let value = node.getAttribute(attributeName);
    if (value == attributeValue) {
      return node;
    } else {
      const childs = node.childNodes;
      if (childs.length > 0) {
        for (let i = 0; i < childs.length; i++) {
          const n: any = this.findByAttribute(childs[i], attributeName, attributeValue, targets);
          if (n) {
            targets.push(n);
          }
        }
      } else {
        return null;
      }
    }

  }

  postGenerateApp(appTree: any): void {
    this.loading.next(true);
    this.loading_value = true;
    const url = `http://localhost:3333/process_app`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'my-auth-token'
      })
    };
    firstValueFrom(this.http.post<OutputFiles>(url, appTree, httpOptions)).then((value: any) => {
      this.trataErrors(value.errors)
      delete value.errors;
      this.dataChange.next(value);

      this.loading.next(false);
      this.loading_value = false;
    }).catch(erro => {
      console.log(erro);

    });
  }

  trataErrors(errors: any) {
    errors.forEach((element: any) => {
      if (Object.keys(element)[0] != '') {
        let data_node = this.getNode(Object.keys(element)[0])['data']
        let props = {}
        for (const p of element[Object.keys(element)[0]]) {
          props[p['property']] = '(undefined)'
        }
        if (!data_node) {
          this.updateXml(Object.keys(element)[0], 'data', JSON.stringify(props))
        } else {

          try {
            data_node = JSON.parse(data_node['v'])
          } catch (error) {
            data_node = {}
          }

          data_node = { ...data_node, ...props }
          this.updateXml(Object.keys(element)[0], 'data', JSON.stringify(data_node))
        }
      }
    });
  }

  updateXml(id: string, att: string, value: string) {
    var parser = new DOMParser();
    const xml_parsed: any = parser.parseFromString(this.root_xml_str, 'text/xml');
    const node = this.findId(xml_parsed, id);
    if (node) {
      if (node.localName == 'object') {
        node.setAttribute(att, value)
        this.root_xml_str = xml_parsed.childNodes[0].outerHTML;
        this.update.next('' + xml_parsed.childNodes[0]['outerHTML'])
      } else {
        var parent = node.parentElement;
        node.removeAttribute('id');
        node.removeAttribute('value');
        const xml: any = parser.parseFromString(`<object label=\"\" id=\"${id}\">${node.outerHTML}</object> `, 'text/xml').childNodes[0];
        node.remove();
        xml.setAttribute(att, value);
        parent.appendChild(xml);
        this.root_xml_str = xml_parsed.childNodes[0].outerHTML;
        this.update.next('' + xml_parsed.childNodes[0]['outerHTML'])
      }

    }
  }

  markAsError(arg0: any, element: any, id: string) {
    const data_to_add = {}
    if (arg0.localName == 'object') {
      const style = arg0.getAttribute('style')
      arg0.setAttribute('style', style + ';strokeWidth=4;strokeColor=#FF3333;')
      element.forEach((e: any) => {
        //arg0.setAttribute(e['property'], `(${e['property']}_undefined)`)
        data_to_add[e['property']] = `(${e['property']}_undefined)`
      });

    } else {

      var parent = arg0.parentElement;
      var parser = new DOMParser();
      arg0.removeAttribute('id')
      const style = arg0.getAttribute('style')
      arg0.setAttribute('style', style + ';strokeWidth=4;strokeColor=#FF3333;')
      const xml: any = parser.parseFromString(`<object label=\"\" id=\"${id}\">${arg0.outerHTML}</object>`, 'text/xml').childNodes[0];
      arg0.remove();
      element.forEach((e: any) => {
        xml.setAttribute(e['property'], `(${e['property']}_undefined)`)
      });

      parent.appendChild(xml)

    }

  }


  addFolder(zip: any, data: any) {
    return Object.keys(data).reduce<any[]>((accumulator, key) => {
      const value = data[key];

      if (value != null) {
        if (typeof value === 'object') {
          this.addFolder(zip.folder(key), value)
        } else {
          if (key.includes('.zip'))
            zip.file(key, value, { base64: true });
          else
            zip.file(key, value);
        }
      }
      return zip;
    }, []);
  }


  download = async () => {
    const zip = new JSZip();
    // create a file
    this.addFolder(zip, this.dataChange.value)
    zip.generateAsync({ type: "blob" })
      .then(function (content) {
        // see FileSaver.js
        saveAs(content, "example.zip");
      });

  };
}
