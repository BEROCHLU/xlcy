'use strict';
$('ul.tab-of-list > li').click(function () {
    const INDEX = $(this).index();
    //アクティブなクラスは全て削除
    $('li').removeClass('active-tab');
    $('#panel_group>div').removeClass('active-panel');
    //クリックした要素liにアクティブを追加
    $(this).addClass('active-tab');
    $('#panel_group>div').eq(INDEX).addClass('active-panel');
});