'use strict';
window.cy = null; //consoleでcyを使うためのグローバル宣言
window.hshTippy = {}; //tippyを連想配列で管理する
let strExcelName = ''; //excelファイル名
let workbook; //instance of sheetjs excel book
// HTTP_HOSTNAME is no longer used

/**
 * This function takes two arguments, a collection of nodes and a collection of edges,
 * and returns a Promise that resolves when the Cytoscape instance is ready.
 * @param {Array.<Object>} collecNode - A collection of node data objects.
 * @param {Array.<Object>} collecEdge - A collection of edge data objects.
 * @returns {Promise} A Promise that resolves when the Cytoscape instance is ready.
 */
function drawCytoscape(collecNode, collecEdge) {
    // Get the container element for the Cytoscape instance
    const container = document.getElementById('cy');
    const layout = {
        name: 'dagre',
        rankDir: 'LR',
        //ranker: 'network-simplex',
        nodeSep: 180,
        edgeSep: 120,
        rankSep: 200
    };

    // Create a new Cytoscape instance with the given options
    return new Promise(async (resolve, reject) => {
        try {
            window.cy = cytoscape({
                container: container,
                boxSelectionEnabled: false,
                autounselectify: false, //clickしたときに色変えない
                maxZoom: 5,
                minZoom: 1 / 25,
                wheelSensitivity: 0.2,
                layout: layout,
                style: await fetch('./static/style/cy-style.json').then(response => response.json()),
                elements: {
                    nodes: collecNode,
                    edges: collecEdge
                }
            });
        } catch (error) {
            // Handle any errors that occur during Cytoscape initialization
            handleCytoscapeError(error);
            reject(error);
        }

        // When the Cytoscape instance is ready, add event listeners and resolve the Promise
        cy.ready(async () => {
            await readyInCytoscape();
            resolve();
        });
    });
}

// This function handles any errors that occur during Cytoscape initialization
function handleCytoscapeError(error) {
    const strMessage = `${error.toString()}\nThe node dosen't correspond to the edge\nPlease check the excel file`;
    alert(strMessage);
    console.error(error);
}
/**
 * Initializes arrays to hold grid edges and nodes, sets node labels, and gets background images for nodes if any.
 * ネットワーク図描画の後処理
 * @async
 * @function readyInCytoscape
 * @returns {Promise<void>}
 */
async function readyInCytoscape() {
    // Initialize arrays to hold grid edges and nodes
    let arrGirdNodeAll = [];
    let arrGirdEdgeAll = [];
    let arrGridEdgeModel = [];

    // Filter out the parent node and get all the remaining nodes
    const cyNodes = cy.nodes().filter(node => !node.isParent());
    const cyMin = cy.edges().min(edge => edge?.data('value'));
    const cyMax = cy.edges().max(edge => edge?.data('value'));

    // Asynchronously process each node
    await Promise.allSettled(cyNodes.map(async (node) => {
        // Set the node label and add it to the array of all nodes
        node.css('label', `${node.data('label')}`);
        arrGirdNodeAll.push(node.data());

        // Get the background image for the node, if any
        const strImage = node.data('image');
        if (strImage) {
            // Get the image dimensions using an asynchronous function
            const eleImg = await syncGetMeta(`./static/image/${strImage}`);
            const {
                naturalHeight: h,
                naturalWidth: w
            } = eleImg;

            // Set the node CSS properties for the background image
            node.css({
                height: `${h}px`,
                width: `${w}px`,
                'background-image': `./static/image/${strImage}`
            });
        } else {
            // If there is no background image, set the 'background-image' property to 'none'
            node.css('background-image', 'none');
        }

        const sum_incomers = node.incomers('edge').reduce(function (total, ele, i, eles) {
            return total + ele.data('value');
        }, 0);
        node.data('value', sum_incomers);

        const sum_outgoers = node.outgoers('edge').reduce(function (total, ele, i, eles) {
            return total + ele.data('value');
        }, 0);
        node.data('value') || node.data('value', sum_outgoers);

        // 個別の force_show_value 列が true かどうかを判定
        const isForceShow = (node.data('force_show_value') === true);

        // 「全体で値表示が有効」または「個別で強制表示指定（force_show_valueがtrue）」の場合に値を表示
        if (SHOW_NODE_VALUE || isForceShow) {
            const newValue = node.data('value')?.toLocaleString('en-US') ?? '';
            const newLabel = `${node.css('label')}\n${NODE_CURRENCY}${newValue}${NODE_UNIT}`;
            node.css('label', newLabel);
        }

    }));

    cy.edges().forEach(edge => {
        const newLabel = edge.data('label')?.toLocaleString('en-US') ?? '';
        edge.css({
            'label': `${EDGE_CURRENCY}${newLabel}${EDGE_UNIT}`,
            'curve-style': edge.data('curve-style')
        });

        if (USE_SCALE_WIDTH) {
            edge.css(
                'width', logScaleValue(edge.data('value'), [cyMin.value, cyMax.value], [2, 100]) || undefined
            );
        }

        arrGridEdgeModel.push(edge.data('model'));
        arrGirdEdgeAll.push(edge.data());
    });

    addTapListener(); //defined other file
    addCxtTapListener(); //defined other file
    gridForceUpdate(arrGirdNodeAll, arrGirdEdgeAll, arrGridEdgeModel); //defined other file
}
/**
 * REMOTE FILE
 * リモートファイル表示
 */
document.querySelector('#show_demo').addEventListener('click', async () => {

    if (xlsx_file.value === '') return;

    const url = `./static/uploads/${xlsx_file.value}`;
    const file = await fetch(url, { cache: 'no-store' }).then(response => {
        if (!response.ok) {
            console.error('response.ok:', response.ok);
            console.error('response.status:', response.status);
            console.error('response.statusText:', response.statusText);
            throw new Error(response.statusText);
        }
        // Todo this
        const DATE_NOW = moment().format('HH:mm:ss');
        document.querySelector('#result').innerHTML = `${DATE_NOW} load: ${decodeURI(response.url)}`;
        return response;
    })
        .catch(err => {
            console.error(`An error has occurred. Please reaload the page.`, err);
        });

    input_xlsx.value = ''; //changeが動かなくなるのでinput fileを初期化
    if (!file) return;

    await beginDrawCytoscape(file, true);
});
/**
 * REMOTE FILE
 * リモート位置保存 *
 */
document.querySelector('#upload_json').addEventListener('click', () => {

    if (!cy) return;

    const json = fixParentPosition();
    const strJsonName = `${_.split(xlsx_file.value, '.', 1)}.json`; //'***.json'
    const formData = new FormData(); //SPO versionはこれより下のコードを入れ替える
    formData.append('json', JSON.stringify(json));
    formData.append('filename', strJsonName);

    //Don't set Content-Type when using FormData.
    fetch('./index.php/static', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(strMessage => {
            const DATE_NOW = moment().format('HH:mm:ss');
            const absoluteUrl = new URL(`./static/uploads/${strJsonName}`, window.location.href).href;
            document.querySelector('#result').innerHTML = `${DATE_NOW} saved: ${decodeURI(absoluteUrl)}`;
            console.log(strMessage);
        })
        .catch(err => {
            alert('Failed to save layout. Please check server logs and directory write permissions.\n' + err.message);
            console.log(err);
        });
});
/**
 * REMOTE FILE
 * リモート位置復元 *
 */
document.querySelector('#fetch_json').addEventListener('click', async () => {

    if (!cy) return;

    const strJsonName = `${_.split(xlsx_file.value, '.', 1)}.json`;
    const url = `./static/uploads/${strJsonName}`;
    const text = await fetch(url, { cache: 'no-store' }).then(response => response.text());
    const obj = JSON.parse(text);

    const objFix = fixJsonDifferences(obj);

    cy.json(objFix);

    const DATE_NOW = moment().format('HH:mm:ss');
    const absoluteUrl = new URL(url, window.location.href).href;
    document.querySelector('#result').innerHTML = `${DATE_NOW} load: ${decodeURI(absoluteUrl)}`; //SPO
});
/**
 * 線の表示変更
 */
document.querySelector('#edge_type').addEventListener('change', () => {
    //idはそのまま変数として使える
    cy.edges().css('curve-style', edge_type.value);
});
/**
 * deploy or develop mode
 */
window.addEventListener('load', async () => {
    await syncGetExcelList();

    if (window.location.hostname === '127.0.0.1') {
        $('.button-menu').click();
        //console.log('click .button-menu');
        setTimeout(() => {
            document.querySelector('#show_demo').click();
            //console.log(`click #show_demo`);
        }, 1000);
    }

    const inputText = localStorage.getItem('inputText');
    if (inputText) {
        xlsx_file.value = inputText;
        console.log(`Load localStorage: ${inputText}`);
    }
    //console.log(`load complete`);
});

const elemMenu = document.querySelector('.button-menu');
const elemNav = document.querySelector('nav');

elemMenu.addEventListener('click', () => {
    // Toggle the "open-menu" class on the navigation menu element
    elemNav.classList.toggle('open-menu');
    // Update the text content of the menu button based on whether the menu is open or closed
    elemMenu.textContent = (elemNav.classList.contains('open-menu')) ? 'Close' : 'Menu';
});
/**
 * clickだけならhtmlに書いてしまおうか
 */
document.querySelector('.show-tippy').addEventListener('click', showAllTippy);
/**
 * clickだけならhtmlに書いてしまおうか
 */
document.querySelector('.hide-tippy').addEventListener('click', tippy.hideAll);
/**
 * LOCAL FILE
 * ファイルを選択
 */
document.querySelector('#input_xlsx').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await beginDrawCytoscape(file, false);
    const DATE_NOW = moment().format('HH:mm:ss');
    document.querySelector('#result').innerHTML = `${DATE_NOW} load: ${strExcelName}`;
    e.target.value = '';
});
/**
 * LOCAL FILE
 * 位置保存
 */
document.querySelector('#download_json').addEventListener('click', () => {

    if (!cy) return;

    const json = fixParentPosition();
    const fileToSave = new Blob([JSON.stringify(json)], {
        type: 'application/json'
    });
    const HHmm = moment().format('HHmm');
    const strName = `${strExcelName}_${HHmm}.json`;

    saveAs(fileToSave, strName); //入力ファイル名+時刻
    const DATE_NOW = moment().format('HH:mm:ss');
    document.querySelector('#result').innerHTML = `${DATE_NOW} saved: ${strName}`;
});
/**
 * LOCAL FILE
 * 位置復元
 */
document.querySelector('#restore_json').addEventListener('change', async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name; //ファイル名を取得
    const text = await file.text();
    const json = JSON.parse(text);
    const objRemote = fixJsonDifferences(json);

    cy.json(objRemote);
    const DATE_NOW = moment().format('HH:mm:ss');
    document.querySelector('#result').innerHTML = `${DATE_NOW} load: ${fileName}`;
    restore_json.value = ''; //同じファイルを連続して読み込めるようにvalueを削除
});
/**
 * Adds a click event listener to the element with class 'lt', which calculates the shortest path between two nodes in the Cytoscape graph and displays the sum of their 'LT' data attributes.
 * @function
 * @returns {void}
 */
document.querySelector('.lt').addEventListener('click', () => {
    // Get the IDs of the root and leaf nodes from the input fields
    const strRootID = document.querySelector('#lt_start').value; //"[id='□□仕入先']"
    const strLeafID = document.querySelector('#lt_end').value; //"[id='〇〇工場']"
    // Filter out the nodes that are not visible
    const cyFiltered = cy.elements().filter(function (ele, i) {
        return (ele.css('visibility') === 'visible');
    });

    // Calculate the shortest path using Dijkstra's algorithm in visible nodes
    const cyDijkstra = cyFiltered.dijkstra({
        root: `[id='${strRootID}']`,
        weight: function (ele) {
            // weightが未指定ならvalueを使用、どちらも無ければ0を返すフォールバック処理
            return ele.data('weight') ?? ele.data('value') ?? 0;
        },
        directed: USE_DIRECTED
    });

    // Get the path between the root and leaf nodes, and select it in the graph
    const cyPath = cyDijkstra.pathTo(cy.nodes(`[id='${strLeafID}']`));
    // edgeのweightだけの合計、nodeのweightは含まない
    let nWeight = cyDijkstra.distanceTo(cy.nodes(`[id='${strLeafID}']`));

    cy.elements().unselect(); //reset select
    cyPath.select();

    let strTextarea = '';
    cyPath.forEach(ele => {
        let str = ele.data('label');
        if (ele.isEdge()) {
            str += ` ${ele.data('id')}`;
        }
        strTextarea += `${str}\n`;
        // nodeのweightを加算する
        if (ele.isNode()) {
            nWeight += ele.data('weight') ?? 0;
        }
        //console.log(ele.data('id'));
    });

    document.querySelector('.lt-unit').textContent = nWeight;
    document.querySelector('#textarea_path').textContent = strTextarea;
});
document.querySelector('#click_allon').addEventListener('click', () => {
    toggleClickModelsAll(true);
});
document.querySelector('#click_alloff').addEventListener('click', () => {
    toggleClickModelsAll(false);
});
/** 
document.querySelector('#sort_node').addEventListener('click', () => {
    const cyVisibleNodes = cy.nodes().filter(function (node) {
        return node.visible();
    });
    const layout = cyVisibleNodes.layout({
        name: 'dagre',
        rankDir: 'LR',
        ranker: 'network-simplex',
        nodeSep: 180,
        edgeSep: 120,
        rankSep: 200
    });
    layout.run();
});*/
document.querySelector('.save-button').addEventListener('click', () => {
    const inputText = document.getElementById("xlsx_file").value;
    localStorage.setItem("inputText", inputText);
    document.querySelector('#result').innerHTML = `Saved localStorage: ${inputText}`;
    console.log(`Saved localStorage: ${inputText}`);
});
/**
 * Appends options to two select elements and clears a container element.
 * @function
 * @returns {void}
 */
function appendOption() {
    // Remove existing options and clear container
    $('#lt_start>option').remove();
    $('#lt_end>option').remove();
    document.querySelector('.lt-unit').innerHTML = '';

    // Loop through all nodes in the cytoscape graph
    cy.nodes().forEach(node => {
        const strID = node.data('id');
        const elemStart = document.createElement('option');
        const elemEnd = document.createElement('option');
        // Skip the parent node
        if (node.isParent()) return;
        // Set the value and text of each option element
        elemStart.value = strID;
        elemStart.innerHTML = strID;
        elemEnd.value = strID;
        elemEnd.innerHTML = strID;

        // Append the option elements to their respective select elements
        document.querySelector('#lt_start').append(elemStart);
        document.querySelector('#lt_end').append(elemEnd);
    });
}
/**
 * Draws a cytoscape graph and initializes spreadsheet data from an uploaded file.
 *
 * @async
 * @param {File} file - The file to be processed.
 * @return {Promise<void>} A Promise that resolves when the processing is complete, return is not necessary
 */
async function beginDrawCytoscape(file, isServer = false) {

    const data = await file.arrayBuffer();
    workbook = XLSX.read(data, {
        type: 'array',
        sheets: ['node', 'edge', 'option']
    });
    // Convert workbook data to arrays for cytoscape and spreadsheet
    const [aoaNodes, aoaEdges] = workbookToArrays(workbook);

    // Draw the cytoscape graph
    await drawCytoscape(aoaNodes, aoaEdges);

    // Post-cytoscape drawing operations
    destroyAllTippy(); // Remove all previous tippy elements
    appendOption();
    cyCreateTippy();

    if (isServer) {
        strExcelName = _.split(xlsx_file.value, '.', 1);
    } else {
        strExcelName = _.split(file.name, '.', 1);
    }
    document.getElementById('edge_type').value = 'bezier';

    if (isServer) {
        // Automatically restore layout if it exists
        const strJsonName = `${_.split(xlsx_file.value, '.', 1)}.json`;
        const url = `./static/uploads/${strJsonName}`;
        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) {
                const text = await response.text();
                const obj = JSON.parse(text);
                const objFix = fixJsonDifferences(obj);
                cy.json(objFix);
                const DATE_NOW = moment().format('HH:mm:ss');
                const absoluteUrl = new URL(url, window.location.href).href;
                document.querySelector('#result').innerHTML = `${DATE_NOW} load: ${decodeURI(absoluteUrl)}`;
                console.log(`Auto-restored layout: ${strJsonName}`);
            } else {
                console.log(`No layout JSON found: ${strJsonName}`);
            }
        } catch (err) {
            console.error('Error auto-restoring remote position:', err);
        }
    }

    // Automatically show all memos
    showAllTippy();
}
/**
 * 
 * @param {String} url 相対パス
 * @returns {Promise} resolveはurlから取得した画像オブジェクト
 */
function syncGetMeta(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
    })
        .catch((error) => {
            console.error('Error loading image:', error);
            throw error; // re-throw the error to propagate it further
        });
}
/**
 * Fixes the JSON object retrieved from the remote by comparing it with the current JSON object of the cytoscape graph and removing any nodes or edges that are present in the current JSON but not in the remote JSON. It also adds any nodes or edges that are present in the current JSON but not in the remote JSON.
 *
 * @function
 * @param {Object} objRemote - The JSON object retrieved from the remote.
 * @returns {Object} The fixed JSON object.
 */
function fixJsonDifferences(objRemote) {

    const arrRemoteNodeid = _.map(objRemote.elements.nodes, 'data.id');
    const arrRemoteEdgeid = _.map(objRemote.elements.edges, 'data.id');

    const objCy = cy.json();
    const objCurrent = {
        "elements": { //idとpositionのみ抜き出す
            "nodes": _.map(objCy.elements.nodes, obj => _.pick(obj, ['data.id', 'position'])),
            "edges": _.map(objCy.elements.edges, obj => _.pick(obj, ['data.id']))
        }
    }

    const arrCurrentNodeid = _.map(objCurrent.elements.nodes, 'data.id');
    const arrCurrentEdgeid = _.map(objCurrent.elements.edges, 'data.id');

    //左(remote)と右(current)でnode json比較　カレント優先node削除
    const arrDiffRemoteNodes = _.difference(arrRemoteNodeid, arrCurrentNodeid);
    if (0 < arrDiffRemoteNodes.length) { //カレント優先
        let collection = objRemote.elements.nodes;
        _.forEach(arrDiffRemoteNodes, diffRemote => {
            //右(remote)にあって左(current)にないのでnode削除
            collection = _.reject(collection, {
                data: {
                    id: diffRemote
                }
            });
            //console.log("node collection", collection);
        });

        objRemote.elements.nodes = collection;
        console.log(arrDiffRemoteNodes, "リモートにあってカレントにないnode一時的に削除");
    }
    //左(remote)と右(current)でedge json比較　カレント優先edge削除
    const arrDiffRemoteEdges = _.difference(arrRemoteEdgeid, arrCurrentEdgeid);
    if (0 < arrDiffRemoteEdges.length) { //カレント優先
        let collection = objRemote.elements.edges;
        _.forEach(arrDiffRemoteEdges, diffRemote => {
            //右(remote)にあって左(current)にないのでedge削除
            collection = _.reject(collection, {
                data: {
                    id: diffRemote
                }
            });
            //console.log("edge collection", collection);
        });

        objRemote.elements.edges = collection;
        console.log(arrDiffRemoteEdges, "リモートにあってカレントにないedge一時的に削除");
    }

    //左(current)のみ存在するnode idを抽出
    const arrDiffCurrNodes = _.difference(arrCurrentNodeid, arrRemoteNodeid);
    if (0 < arrDiffCurrNodes.length) {
        //カレントにあってリモートにないnode idを追加して表示
        _.forEach(arrDiffCurrNodes, (diffcur, i) => {
            const hsh = {
                "data": {
                    "id": diffcur
                }
            }
            objRemote.elements.nodes.push(hsh);
        });
        console.log(arrDiffCurrNodes, "カレントにあってリモートにはないのでnode一時的に追加");
    }
    //左(current)のみ存在するedge idを抽出
    const arrDiffCurrEdges = _.difference(arrCurrentEdgeid, arrRemoteEdgeid);
    if (0 < arrDiffCurrEdges.length) {
        //カレントにあってリモートにないedge idを追加して表示
        _.forEach(arrDiffCurrEdges, (diffcur, i) => {
            const hsh = {
                "data": {
                    "id": diffcur
                }
            }
            objRemote.elements.edges.push(hsh);
        });
        console.log(arrDiffCurrEdges, "カレントにあってリモートにはないedge一時的に追加");
    }

    return objRemote;
}
/**
 * This function fixes the position of parent nodes in a graph.
 * It removes the position attribute from parent nodes and returns the modified graph.
 *
 * @returns {Object} The modified graph with fixed parent positions.
 */
function fixParentPosition() {
    // Array to store the IDs of parent nodes
    let arrStrParent = [];

    // Iterate over all nodes in the graph
    cy.nodes().forEach(function (node) {
        if (node.isParent()) {
            // Add the ID of parent nodes to the array
            arrStrParent.push(node.data('id'));
        }
    });

    // Get the JSON representation of the graph
    const cyJson = cy.json();

    // Extract the necessary properties from node objects
    const colleNodes = _.map(cyJson.elements.nodes, object => {
        return _.pick(object, ['data.id', 'position']);
    });

    // Extract the necessary properties from edge objects
    const colleEdges = _.map(cyJson.elements.edges, object => {
        return _.pick(object, ['data.id']);
    });

    // Remove the position attribute from parent nodes
    _.forEach(colleNodes, node => {
        if (_.includes(arrStrParent, node.data.id)) {
            delete node.position;
        }
    });

    // Return the modified graph
    return {
        "elements": {
            "nodes": colleNodes,
            "edges": colleEdges
        }
    };
}
