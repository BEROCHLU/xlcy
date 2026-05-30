'use strict';
/**
 * gridjsの初期化
 */
const gridelem = new gridjs.Grid({
    data: [" "]
}).render(document.getElementById("grid_node"));

const gridin = new gridjs.Grid({
    sort: true,
    data: [" "]
}).render(document.getElementById("grid_in"));

const gridout = new gridjs.Grid({
    sort: true,
    data: [" "]
}).render(document.getElementById("grid_out"));

const gridModel = new gridjs.Grid({
    sort: true,
    data: [" "]
}).render(document.getElementById("grid_model"));

const gridNodesAll = new gridjs.Grid({
    sort: true,
    data: [" "]
}).render(document.getElementById("grid_nodeall"));

const gridEdgesAll = new gridjs.Grid({
    sort: true,
    data: [" "]
}).render(document.getElementById("grid_edgeall"));
/**
 * Updates the configuration of three GridJS tables: gridModel, gridNodesAll, and gridEdgesAll.
 *
 * @param {Array} arrGirdNodeAll - Array of data for gridNodesAll table
 * @param {Array} arrGirdEdgeAll - Array of data for gridEdgesAll table
 * @param {Array} arrGridEdgeModel - Array of data for gridModel table
 */
function gridForceUpdate(arrGirdNodeAll, arrGirdEdgeAll, arrGridEdgeModel) {
    // Code for updating the grid with model data
    const arrStrModel = _.uniq(arrGridEdgeModel).sort();
    const aoaStrModel = _.map(arrStrModel, strModel => [strModel]);

    gridModel.updateConfig({
        columns: [{
            id: 'model_checkbox',
            name: '✔️',
            data: () => true,
            plugin: {
                // install the RowSelection plugin
                component: gridjs.plugins.selection.RowSelection,
                // RowSelection config
                props: { // cell(0) checkbox, cell(1) model
                    id: (row) => row.cell(1).data
                }
            }
        }, 'model'],
        data: aoaStrModel,
        style: {
            th: {
                'padding': '3px',
                'text-align': 'center'
            },
            td: {
                'padding': '3px',
                'text-align': 'center'
            }
        }
    }).forceRender();

    // Code for updating the grid with NodeAll data
    gridNodesAll.updateConfig({
        columns: [{
            id: 'nodeall_checkbox',
            name: '✔️',
            data: () => true,
            plugin: {
                // install the RowSelection plugin
                component: gridjs.plugins.selection.RowSelection,
                // RowSelection config
                props: {
                    id: (row) => row.cell(1).data
                }
            }
        }, "label",
            "col",
            "row",
        ],
        data: arrGirdNodeAll,
        style: {
            th: {
                'padding': '3px',
                'text-align': 'center'
            },
            td: {
                'padding': '3px',
                'text-align': 'center'
            }
        }
    }).forceRender();

    // Code for updating the grid with EdgeAll data
    gridEdgesAll.updateConfig({
        columns: [{
            id: 'edgeall_checkbox',
            name: '✔️',
            data: () => true,
            plugin: {
                // install the RowSelection plugin
                component: gridjs.plugins.selection.RowSelection,
                //component: RowSelection,
                // RowSelection config
                props: { //row.cell(6).data = edge.data(id)
                    id: (row) => row.cell(6).data
                }
            }
        }, "label",
            "model",
            "value",
            "source",
            "target",
            "id"
        ],
        data: arrGirdEdgeAll,
        style: {
            th: {
                'padding': '3px',
                'text-align': 'center'
            },
            td: {
                'padding': '3px',
                'text-align': 'center'
            }
        }
    }).forceRender();

    // Add events to the grids when they are ready
    gridModel.off('ready', addModelEventReady); // remove previous event
    gridModel.on('ready', addModelEventReady); // add event on ready

    gridNodesAll.off('ready', addNodesEventReady); // remove previous event
    gridNodesAll.on('ready', addNodesEventReady);

    gridEdgesAll.off('ready', addEdgesEventReady); // remove previous event
    gridEdgesAll.on('ready', addEdgesEventReady);
}
/**
 * 全modelテーブルイベント
 * ファイル読み込み時に直前のイベントを削除しないと重複する
 */
function addModelEventReady() {
    // get the plugin instance
    const checkboxPlugin = gridModel.config.plugin.get('model_checkbox');
    // listen to the updated event
    checkboxPlugin.props.store.on('updated', function (state, prevState) {
        let arrModel = state.rowIds;

        cy.ready(() => {
            //全てのedgeに対して表示／非表示
            cy.edges().forEach(edge => {
                const strEdgeid = edge.data('id');
                const strModel = edge.data('model');
                const isVisible = _.includes(arrModel, strModel);

                if (isVisible) {
                    edge.css('visibility', 'visible');//edgeチェックボックスもON
                    toggleClickGridEdge(strEdgeid, true);
                } else {
                    edge.css('visibility', 'hidden');//edgeチェックボックスもOFF
                    toggleClickGridEdge(strEdgeid, false);
                }
            });
            //全てのnodeに対して表示／非表示
            cy.nodes().forEach(node => {
                const strNodeid = node.data('id');
                //完全に独立しているnodeは除外
                if (node.isParent() || node.degree() === 0) return;
                //nodeに接続されたedgeうちvisibleなものを数える
                const nVisibleEdges = node.connectedEdges().filter(edge => edge.visible()).length;
                if (nVisibleEdges > 0) {
                    node.css('visibility', 'visible');
                    toggleClickGridNode(strNodeid, true);
                } else {
                    node.css('visibility', 'hidden');
                    toggleClickGridNode(strNodeid, false);
                }
            });
        });
    });
}
/**
 * nodeテーブルイベント
 * ファイル読み込み時に直前のイベントを削除しないと重複する
 */
function addNodesEventReady() {
    // find the plugin with the give plugin ID
    const checkboxPlugin = gridNodesAll.config.plugin.get('nodeall_checkbox');
    // subscribe to the store events
    checkboxPlugin.props.store.on('updated', function (state, prevState) {
        // Get the array of row IDs from the updated state
        const arrStateid = state.rowIds;
        //全てのnodeに対して表示／非表示
        cy.nodes().forEach(node => {
            if (node.isParent()) return;

            const strid = node.data('id');
            const isVisible = _.includes(arrStateid, strid);

            if (isVisible) {
                node.css('visibility', 'visible');
            } else {
                node.css('visibility', 'hidden');
            }
        });
    });
}
/**
 * edgeテーブルイベント
 * ファイル読み込み時に直前のイベントを削除しないと重複する
 */
function addEdgesEventReady() {
    // find the plugin with the give plugin ID
    const checkboxPlugin = gridEdgesAll.config.plugin.get('edgeall_checkbox');
    // subscribe to the store events
    checkboxPlugin.props.store.on('updated', function (state, prevState) {
        const arrStateid = state.rowIds;
        //全てのedgeに対して表示／非表示
        cy.edges().forEach(edge => {
            const strid = edge.data('id');
            const isVisible = _.includes(arrStateid, strid);

            if (isVisible) {
                edge.css('visibility', 'visible');
            } else {
                edge.css('visibility', 'hidden');
            }
        });
    });
}
/**
 * Toggles the visibility of a row in a table based on the given node ID and visibility flag.
 * @param {string} strNodeid - The ID of the node to toggle.
 * @param {boolean} isVisible - The desired visibility state of the row.
 */
function toggleClickGridNode(strNodeid, isVisible) {
    // Find all table rows with matching node column
    const $row = $("#grid_nodeall tbody > tr").filter(function () {
        return $(this).find("td[data-column-id='label']").text() === strNodeid;
    });

    // Update checkbox state if necessary
    const $checkbox = $row.find("td[data-column-id='nodeall_checkbox'] input");
    const isChecked = $checkbox.prop("checked");

    if ((isVisible && !isChecked) || (!isVisible && isChecked)) {
        // It must be clicked because the checkboxPlugin does not update the state correctly
        $checkbox.trigger("click");
    }
}
/**
 * Toggles the visibility of a grid edge.
 *
 * @param {string} strEdgeid - The ID of the edge.
 * @param {boolean} isVisible - Whether the edge should be visible or not.
 */
function toggleClickGridEdge(strEdgeid, isVisible) {
    // Find all table rows with matching node column
    const $row = $("#grid_edgeall tbody > tr").filter(function () {
        return $(this).find("td[data-column-id='id']").text() === strEdgeid;
    });

    const $checkbox = $row.find("td[data-column-id='edgeall_checkbox'] input");
    const isChecked = $checkbox.prop("checked");
    // Update checkbox state if necessary
    if ((isVisible && !isChecked) || (!isVisible && isChecked)) {
        // It must be clicked because the checkboxPlugin does not update the state correctly
        $checkbox.trigger("click");
    }
}
/**
 * Toggles the state of all checkboxes in a table row based on the value of isAllChecked parameter
 * @param {boolean} isAllChecked - The desired state of the checkboxes (true for checked, false for unchecked)
 */
function toggleClickModelsAll(isAllChecked) {
    // Get all rows in the table body
    const $row = $("#grid_model tbody > tr");

    // Loop through each row
    $row.each(function () {
        // Find the checkbox input element in the current row
        const $checkbox = $(this).find("td[data-column-id='model_checkbox'] input");
        // Check if the checkbox is currently checked or not
        const isChecked = $checkbox.prop("checked");
        // If the desired state of the checkbox is different from the current state, trigger a click event to change it
        if ((isAllChecked && !isChecked) || (!isAllChecked && isChecked)) {
            // It must be clicked because the checkboxPlugin does not update the state correctly
            $checkbox.trigger("click");
        }
    });
}