'use strict';

/*
 * ここに宣言され export される関数たちは、
 * 引数を与えられずに呼び出された時に自分について説明する必要がある。
 * 説明は次のフォーマットでなければならない (MUST)。
 *
 * "簡単な説明\nそして詳細な説明"
 *
 * 簡単な説明と詳細な説明との間は改行文字 '\n' で区切られなければならない。
 * 簡単な説明は前処理の種類の一覧として利用される。
 * “🤪  前処理のパラメータ” について説明する場合、絵文字の次の文字は NBSP である。
 * その部分で改行されては不恰好である。
 */

/**
 * 何もしない (1% の確率で本当に何もしない)。
 *
 * @param{ { text: string, url: URL } } [ textUrl ] 操作対象となるテキストと URL
 * @param{ string | undefined } [ params = '' ] 無視される
 * @returns{ { text: string, url: URL | string } | string } 操作後のテキストと URL
 */
export function
noOperation(textUrl, params = '')
{
    if (textUrl === undefined)
        return `💤 なにもしない
        この前処理はなにもしません。
        “🤪 前処理のパラメータ” に指定して内容は単に無視されます。
        うーん、なんだか眠くなってきた……
        あ、そうだ、前処理として欲しい機能があったら issue か PR を送り付けてね！
        `;

    if (Math.random() < 0.01)
        textUrl = { text: 'すやすや……💤', url: '' };
    return textUrl;
}

/**
 * URL からフラグメント識別子を取り去る
 *
 * @param{ { text: string, url: URL } } [ textUrl ] 操作対象となるテキストと URL
 * @param{ string } [ params = '' ] 無視される
 * @returns{ { text: string, url: URL } | string } 操作後のテキストと URL
 */
export function
removeHash(textUrl, params = '')
{
    if (textUrl === undefined)
        return `ページの URL からフラグメント識別子を取り去る
        訪問しているページの URL からフラグメント識別子（# とそれ以降の文字列）を取り去ります。
        “🤪 前処理のパラメータ” に指定された内容は単に無視されます。
        `;

    textUrl.url.hash = '';
    return textUrl;
}

/**
 * URL から指定されたパラメータを取り去る。
 *
 * @param{ { text: string, url: URL } } [ textUrl ] 操作対象となるテキストと URL
 * @param{ string } [ params = '' ] 取り去るパラメータのカンマ区切りのリスト
 * @returns{ { text: string, url: URL } | string } 操作後のテキストと URL
 */
export function
removeUrlParams(textUrl, params = '')
{
    if (textUrl === undefined)
        return `ページの URL から次のパラメータを取り去る
        訪問しているページの URL から指定されたパラメータ (クエリ文字列) を取り去ります。
        “🤪 前処理のパラメータ” には、取り去るパラメータの名前をカンマ (,) 区切りで指定します。
        カンマの前後にある空白文字は無視されます。
        例えば、“list, index” では “list” と “index” の名前を持つパラメータが取り去られます。
        `;

    const paramList = params.split(',').map(e => e.trim());
    paramList.forEach(param => textUrl.url.searchParams.delete(param));
    return textUrl;
}

/**
 * テキストを置換する
 *
 * @param{ { text: string, url: URL } } [ textUrl ] 操作対象となるテキストと URL
 * @param{ string } [ params = 's//' ] s/reg/rep/flags 書式の置換命令
 * @returns{ { text: string, url: URL } | string } 操作後のテキストと URL
 */
export function
replaceText(textUrl, params = 's//')
{
    if (textUrl === undefined)
        return `テキストを置換する
        訪問しているページのタイトル文字列を置換します。
        “🤪 前処理のパラメータ” には、“s/reg/rep/flags” の形式で置換命令を指定します。
        この形式以外の文字列が与えられた場合、置換を行いません。
        置換命令の区切り文字にはスラッシュ (/) 以外の文字をも利用できます。
        置換命令の reg の部分には正規表現を利用でき、rep の部分には置換文字列を利用できます。
        置換命令の flag の部分には正規表現の振舞いを制御するフラグ文字列を指定します。
        置換命令の rep の直後の区切り文字と flags は省略可能です。
        flags に “g” を指定しない場合、最初の一つのみが置換されることに注意してください。
        例えば、“s/twitter/X/gi” は、大文字小文字を区別しない全ての “twitter” を “X” に置換します。
        また、“s/^\\(\\d+\\)\\s*/” は、タイトルの先頭にある丸括弧に囲まれた数字列とそれに続く空白を取り去ります。
        `;

    params = params.trimStart();
    const args = params.split(params[1]);
    if (args[0] !== 's' || args.length < 3)
        return textUrl; // invalid command is ignored
    textUrl.text = textUrl.text.replace(new RegExp(args[1], args[3]), args[2]);
    return textUrl;
}
