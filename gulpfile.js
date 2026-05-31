const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify'); // JavaScriptのコードを圧縮（Minify）するモジュール
const concat = require('gulp-concat'); // 複数のファイルを1つに結合するモジュール
const order = require('gulp-order');   // 結合時のファイルの順序を制御するモジュール
const fs = require('fs');             // ファイルの読み書きを行うNode.js標準モジュール

/**
 * JSビルドタスク: 自作JSファイルを結合・圧縮し、ソースマップ付きで bundle.js を出力する
 * コマンド「npm run build:js」で実行される
 */
gulp.task('build:js', function () {
    return gulp.src(['./public/static/js/*.js', '!./public/static/js/bundle.js'])
        .pipe(sourcemaps.init())
        .pipe(order([
            'server-fetch.js',
            'workbook-utils.js',
            'gridjs-updater.js',
            'tippy-attach.js',
            'cytoscape-gestures.js',
            'jqtab.js',
            'entry.js'
        ]))
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/dist'));
});

/**
 * ライセンスタスク: 各サードパーティライブラリのライセンスファイルを統合して dist/LICENSE.txt を生成する
 * コマンド「npm run build:license」で実行される
 */
gulp.task('build:license', function () {
    return gulp.src([
        './public/static/licenses/**/*',
        '!./public/static/licenses/LICENSE.txt' // 自分自身を除外して無限結合を防ぐ
    ])
        .pipe(concat('LICENSE.txt'))
        .pipe(gulp.dest('./public/dist'));
});

/**
 * インライン化タスク: JSをメモリ上で結合・圧縮し、そのまま index.html へ直接流し込む
 * (中間ファイル bundle.js のディスク生成は行いません)
 * コマンド「npm run review:inline」で実行される
 */
/*
gulp.task('review:inline', function (done) {
    let jsContent = '';

    return gulp.src(['./public/static/js/*.js', '!./public/static/js/bundle.js'])
        .pipe(order([
            'server-fetch.js',
            'workbook-utils.js',
            'gridjs-updater.js',
            'tippy-attach.js',
            'cytoscape-gestures.js',
            'jqtab.js',
            'entry.js'
        ]))
        .pipe(concat('bundle.js')) // 出力せず、ストリーム上で1つの仮想ファイルにまとめる
        .pipe(uglify())           // まとめたJSを圧縮
        // ここで dest に書き出さず、ストリーム内のデータ（JSの中身）を直接メモリ上で取得
        .on('data', function (file) {
            jsContent = file.contents.toString('utf8');
        })
        // 処理が完了したタイミングで HTML を上書き更新する
        .on('end', function () {
            const htmlPath = './public/index.html';
            let htmlContent = fs.readFileSync(htmlPath, 'utf8');
            // </main>の直後にある最初の <script>...</script> タグ全体を対象にする
            const targetRegex = /(<\/main>[\s\S]*?)<script.*?>[\s\S]*?<\/script>/;

            htmlContent = htmlContent.replace(targetRegex, `$1<script>\n${jsContent}\n</script>`);
            fs.writeFileSync(htmlPath, htmlContent, 'utf8');
            done();
        });
});*/
