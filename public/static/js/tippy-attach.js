'use strict';
/**
 * Creates Tippy instances for all elements in the Cytoscape graph with a non-empty 'memo' data attribute.
 * @function
 * @returns {void}
 */
function cyCreateTippy() {
    // Loop through all elements in the graph
    cy.elements('*').forEach((elem, i) => {
        const strid = elem.data('id');
        const strMemo = elem.data('memo');
        const strelemid = elem.data('elemid');
        // If the element has no memo, skip it
        if (!strMemo) return;
        // Create a Tippy instance for the element and add it to the global `window.hshTippy` object
        const tip = makeTippy(cy.getElementById(strid), strMemo, strelemid);
        window.hshTippy[strelemid] = tip;
    });
}
/**
 * 
 * @param {HTMLElement} cyId getElementById
 * @param {String} strMemo 
 * @param {String} strelemid 
 * @returns {Object} tippy object
 */
function makeTippy(cyId, strMemo, strelemid) {
    const ref = cyId.popperRef();
    // Since tippy constructor requires DOM element/elements, create a placeholder
    const dummyDiv = document.createElement('div');

    return tippy(dummyDiv, {
        getReferenceClientRect: ref.getBoundingClientRect,
        trigger: 'manual', // mandatory
        content: () => { // function can be better for performance
            const div = document.createElement('div');
            div.setAttribute('element-id', strelemid);
            div.innerHTML = strMemo;
            return div;
        },
        popperOptions: {
            strategy: 'fixed',
            modifiers: [
                {
                    name: 'flip', //Popperが画面外に行く時、反転させるmod
                    enabled: false, //使う|使わない
                    options: {
                        //吹き出しの反転位置はbottomのみ
                        //Popperの反転位置をbottomのみに制限します。ただし、enabledがfalseに設定されているため、この設定は効果を発揮しません。
                        fallbackPlacements: ['bottom']
                    }
                },
                {
                    name: 'preventOverflow', // Popperが画面外に行く時、回り込ませるmod
                    enabled: false, //使う|使わない
                    options: {
                        //吹き出しの上下左右回り込み
                        //Popperの主軸（縦または横）に沿った溢れ出し防止を無効化します。ただし、enabledがfalseに設定されているため、この設定は効果を発揮しません。
                        mainAxis: false
                    }
                },
                {
                    name: 'offset',
                    options: {
                        offset: [TIPPY_OFFSET_X, TIPPY_OFFSET_Y],  // [x,y]方向にオフセット
                    },
                }
            ]
        },
        arrow: false,
        placement: 'top',
        hideOnClick: false,
        sticky: 'reference',
        interactive: true,
        maxWidth: 200,
        zIndex: 0,
        moveTransition: '',
        appendTo: document.body // or append dummyDomEle to document.body
    });
}
/**
 * Destroys all Tippy instances stored in the global `window.hshTippy` object.
 * @function
 * @returns {void}
 */
function destroyAllTippy() {
    // Get an array of all Tippy instances
    const arrValue = _.values(window.hshTippy);

    // Call the `destroy` method on each instance
    _.forEach(arrValue, tip => {
        tip.destroy();
    });

    // Reset the global `window.hshTippy` object to an empty object
    window.hshTippy = {};
}
/**
 * Shows all Tippy instances stored in the global `window.hshTippy` object.
 * @function
 * @returns {void}
 */
function showAllTippy() {
    // Get an array of all Tippy instances
    const arrValue = _.values(window.hshTippy);

    // Call the `show` method on each instance
    _.forEach(arrValue, tip => {
        tip.show();
    });
}
/**
 * Toggles the visibility of a Tippy.js tooltip.
 * @function
 * @param {Object} tippyThis - The Tippy.js instance to toggle.
 * @returns {void}
 */
function toggleTippy(tippyThis) {
    if (tippyThis) { //console.log(tippyThis);
        // If the tooltip is currently shown, hide it; otherwise, show it
        (tippyThis.state.isShown === true) ? tippyThis.hide() : tippyThis.show();
    }
}