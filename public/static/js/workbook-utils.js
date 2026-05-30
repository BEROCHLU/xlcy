'use strict';

let NODE_CURRENCY, EDGE_CURRENCY;
let NODE_UNIT, EDGE_UNIT;
let SHOW_NODE_VALUE, USE_SCALE_WIDTH;
let TIPPY_OFFSET_X;
let TIPPY_OFFSET_Y;
let USE_DIRECTED;
/**
 * 
 * @param {Object} workbook 
 * @returns {Array} [0]: node, [1]: edge
 */
function workbookToArrays(workbook) {
    // Extract the worksheet nodes and edges from the workbook.
    const worksheet_node = workbook.Sheets['node'];
    const worksheet_edge = workbook.Sheets['edge'];
    const worksheet_option = workbook.Sheets['option'];
    // Convert the node worksheet to a JSON collection.
    const collection_node = XLSX.utils.sheet_to_json(worksheet_node, {
        range: worksheet_node['!ref']
    });
    // Convert the edge worksheet to a JSON collection.
    const collection_edge = XLSX.utils.sheet_to_json(worksheet_edge, {
        range: worksheet_edge['!ref']
    });
    const collection_option = XLSX.utils.sheet_to_json(worksheet_option, {
        range: worksheet_option['!ref']
    });

    NODE_CURRENCY = collection_option[0]?.['node_currency'] ?? '';
    EDGE_CURRENCY = collection_option[0]?.['edge_currency'] ?? '';
    NODE_UNIT = collection_option[0]?.['node_unit'] ?? '';
    EDGE_UNIT = collection_option[0]?.['edge_unit'] ?? '';
    SHOW_NODE_VALUE = collection_option[0]?.['show_node_value'] ?? false;
    USE_SCALE_WIDTH = collection_option[0]?.['use_scale_width'] ?? false;
    TIPPY_OFFSET_X = collection_option[0]?.['tippy_offset_x'] ?? 0;
    TIPPY_OFFSET_Y = collection_option[0]?.['tippy_offset_y'] ?? 15;
    USE_DIRECTED = collection_option[0]?.['use_directed'] ?? true;

    // Map over the node collection and modify each object to fit the required format.
    const collecNode = _.map(collection_node, (objNode, i) => {
        // if (0 === _.parseInt(objNode['row'])) {//文字列が入ってくる場合がある}
        //css.から始まるkeyのみobjCssに格納
        const hasCssNodes = _.pickBy(objNode, (value, key) => {
            return _.startsWith(key, 'css.');
        });
        const objCss = _.mapKeys(hasCssNodes, (value, key) => {
            return key.replace('css.', '');
        });
        //css.をkeyにもつプロパティを削除
        objNode = _.omit(objNode, _.keys(hasCssNodes));

        objNode['id'] = objNode['label'];
        objNode['elemid'] = `n${i}`;

        return {
            data: objNode, // add data key
            style: objCss
        }
    });
    // Map over the edge collection and modify each object to fit the required format.
    const collecEdge = _.map(collection_edge, (objEdge, i) => {
        //css.から始まるkeyのみobjCssに格納
        const hasCssEdges = _.pickBy(objEdge, (value, key) => {
            return _.startsWith(key, 'css.');
        });
        const objCss = _.mapKeys(hasCssEdges, (value, key) => {
            return key.replace('css.', '');
        });
        //css.をkeyにもつプロパティを削除
        objEdge = _.omit(objEdge, _.keys(hasCssEdges));

        objEdge['id'] = `e${i}`; //edgeのidは自動採番 iは0から始まる
        objEdge['elemid'] = `e${i}`;
        //objCss['curve-style'] = 'unbundled-bezier'; //なぜかcurve-styleをここで入れるとエラーになるのでdata()に入れる

        return {
            data: objEdge, // add data key
            style: objCss
        }
    });
    // Check for duplicate node IDs.
    const arrNodeid = _.map(collecNode, 'data.id');
    const arrDuplicate = _.filter(arrNodeid, (val, i, iteratee) => _.includes(iteratee, val, i + 1));
    if (0 < arrDuplicate.length) {
        window.alert('Warning: Duplicate nodes found.');
    }

    return [collecNode, collecEdge];
}
/**
 * Calculates the logarithmic scale value of a given number within a specified range.
 * @param {number} value - The value to be scaled.
 * @param {Array} from - The range of the original value.
 * @param {Array} to - The range of the scaled value.
 * @returns {number} The scaled value.
 */
function logScaleValue(value, from, to) {
    const fromLog = [Math.log(from[0]), Math.log(from[1])];
    const toLog = [Math.log(to[0]), Math.log(to[1])];

    const scale = (toLog[1] - toLog[0]) / (fromLog[1] - fromLog[0]);
    const capped = Math.min(fromLog[1], Math.max(fromLog[0], Math.log(value))) - fromLog[0];
    return Math.exp(capped * scale + toLog[0]);
}