'use strict';

import Dialog from './dialog.js';
import * as Settings from './settings.js';
import * as PreProcs from './preprocs.js';

const dialog = new Dialog();

/**
 * 食パンを表示する。
 */
function
openBread(dialog)
{
    const p = document.createElement('p');
    p.textContent = '🍞 準備してます、いま';
    p.classList.add('big');
    dialog.setContent(p);
    dialog.openModal();
}

/**
 * Twitter から X に移行する。
 */
async function
twitter2x(items)
{
    const hasTwitter = Object.keys(items).some(key => /twitter/i.test(items[key].name));
    if (hasTwitter) {
        const [ ok, check ] = await new Promise(r => {
            const p = document.createElement('p');
            p.textContent = '💪 Twitter を X に置き換えますくｗｗｗｗ';
            const check = document.createElement('input');
            check.setAttribute('type', 'checkbox');
            const labelCheck = document.createElement('label');
            labelCheck.append(check, ' ', '二度と見えない');
            const divCheck = document.createElement('div');
            divCheck.append(labelCheck);
            const buttonCancel = document.createElement('button');
            buttonCancel.textContent = '忘れる';
            buttonCancel.addEventListener('click', _ => r(dialog.close([ false, check.checked ])));
            const buttonOk = document.createElement('button');
            buttonOk.textContent = 'はい';
            buttonOk.addEventListener('click', _ => r(dialog.close([ true, true ])));
            const divButtons = document.createElement('div');
            divButtons.style.textAlign = 'right';
            divButtons.append(buttonCancel, ' ', buttonOk);
            dialog.setContent(p, divCheck, divButtons);
            dialog.openModal();
        });
        if (ok) {
            openBread(dialog);
            for (const key in items) {
                const item = await Settings.getItem(key);
                item.name = item.name.replaceAll(/twitter/gi, 'X');
                await Settings.setItem(key, item);
            }
            await Settings.setFlag('twitter2x', true);
            window.location.reload();
        }
        if (check)
            await Settings.setFlag('twitter2x', true);
        else
            await Settings.setSessionFlag('twitter2x', true);
    } else {
        await Settings.setFlag('twitter2x', true);
    }
}

/**
 * 前処理機能を紹介する。
 */
async function
introducePreProcs()
{
    const result = await new Promise(r => {
        const b = document.createElement('b');
        b.textContent = '【新機能解禁】前処理機能について【令和最新式】';

        const p = document.createElement('p');
        p.innerHTML = `
        前処理機能を利用することで共有前に訪問しているページの情報を修正することができます。<br>
        例えば、秘蔵の ASMR プレイリストの中からオススメの一品を共有しようとしたときのこと。
        共有される URL にプレイリストの情報が含まれていたら、あなたの趣味はインターネットに大公開されてしまいます。
        また、例えば、未視聴の動画が溜まりに溜まっているときのこと。
        共有されるテキストに溜まった通知の数が含まれていたら、一端のオタクとして示しがつきません。<br>
        前処理機能はこれらの問題を解決できます。
        上の二つの問題を解決する例を前処理機能のサンプルとして追加しておきました。<br>
        これからももっと訪問しているページを共有しなさい❤️
        `;

        const buttonYes = document.createElement('button');
        buttonYes.textContent = 'わかった';
        buttonYes.addEventListener('click', _ => r(dialog.close(true)));

        const buttonNo = document.createElement('button');
        buttonNo.textContent = 'わからない';
        buttonNo.addEventListener('click', _ => r(dialog.close(false)));

        const div = document.createElement('div');
        div.style.textAlign = 'right';
        div.append(buttonYes);
        div.append(' ');
        div.append(buttonNo);

        dialog.setContent(b, p, div);
        dialog.openModal();
    });

    if (result)
        await Settings.setFlag('preprocs', true);
}

/**
 * 要素を初期化する。
 * 読み込み完了時のイベントハンドラ。
 */
async function
initialize(_)
{
    openBread(dialog);

    await Settings.migrate();

    const manifest = chrome.runtime.getManifest();
    window.versionStr.textContent = `(v${manifest.version})`

    const items = await Settings.getAllItems();
    Object.keys(items).forEach(key => {
        const item = items[key];
        const option = document.createElement('option');
        option.textContent = item.name;
        option.setAttribute('value', key);
        window.shareVia.appendChild(option.cloneNode(true));
        window.itemList.appendChild(option.cloneNode(true));
    });

    const procs = await Settings.getAllPreProcs();
    Object.keys(procs).forEach(key => {
        const proc = procs[key];
        const option = document.createElement('option');
        option.textContent = proc.description;
        option.setAttribute('value', key);
        window.procList.appendChild(option.cloneNode(true));
    });

    Object.keys(PreProcs).forEach(key => {
        const option = document.createElement('option');
        option.textContent = PreProcs[key]().split('\n')[0];
        option.setAttribute('value', key);
        window.procProc.appendChild(option.cloneNode(true));
    });

    dialog.close();

    if (! await Settings.getFlag('twitter2x') && ! await Settings.getSessionFlag('twitter2x'))
        await twitter2x(items);

    if (! await Settings.getFlag('preprocs'))
        await introducePreProcs();
}
window.addEventListener('DOMContentLoaded', initialize);

/**
 * 共有する。
 * 共有フォームのイベントハンドラ。
 */
async function
share(e)
{
    e.preventDefault();
    window.btnShare.disabled = true;
    window.btnShare.value = '😁 待たれよ';

    const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    const tab = tabs[0];

    const item = await Settings.getItem(window.shareVia.value);
    const url = new URL(item.url);

    let textUrl = { text: tab.title, url: new URL(tab.url) };
    const allProcs = await Settings.getAllPreProcs();
    const procs = Object.keys(allProcs).reduce((procs, key) => {
        const proc = allProcs[key];

        let matched = true;
        if (proc.urlIsRE) {
            if (proc.url.at(-1) !== '$')
                proc.url += '$';
            matched &&= RegExp(proc.url).test(textUrl.url.hostname);
        } else {
            const index = textUrl.url.hostname.lastIndexOf(proc.url);
            matched &&= index !== -1 && index === textUrl.url.hostname.length - proc.url.length;
        }
        if (proc.shareIsRE) {
            if (proc.share.at(-1) !== '$')
                proc.share += '$';
            matched &&= RegExp(proc.share).test(url.hostname);
        } else {
            const index = url.hostname.lastIndexOf(proc.share);
            matched &&= index !== -1 && index === url.hostname.length - proc.share.length;
        }
        if (matched)
            procs.push(proc);

        return procs;
    }, []).filter(e => e.priority >= 0);
    procs.sort((a, b) => a.priority - b.priority);
    procs.forEach(
        proc => textUrl = (PreProcs[proc.proc] || PreProcs.noOperation)(textUrl, proc.param)
    );

    if (item.urlKey === null) {
        url.searchParams.set(item.textKey, textUrl.text + ' ' + textUrl.url.toString());
    } else {
        url.searchParams.set(item.textKey, textUrl.text);
        url.searchParams.set(item.urlKey, textUrl.url.toString());
    }
    window.location.href = url.toString();

    return false;
}
window.formShare.addEventListener('submit', share);

/**
 * 設定項目を更新する。
 * itemList のイベントハンドラ。
 */
async function
changeList(e)
{
    const item = await Settings.getItem(e.target.value)
        || { name: '', url: '', textKey: '', urlKey: '' };

    window.itemName.value = item.name;
    window.itemUrl.value = item.url;
    window.itemTextKey.value = item.textKey;
    window.itemUrlKey.value = item.urlKey || '';
    window.itemUrlAsText.checked = item.urlKey === null;
    window.itemUrlKey.disabled = window.itemUrlAsText.checked;
}
window.itemList.addEventListener('change', changeList);

/**
 * 前処理項目を更新する。
 * procList のイベントハンドラ。
 */
async function
changeProcList(e)
{
    const proc = await Settings.getPreProc(e.target.value) || {};

    window.procDesc.value = proc.description || '';
    window.procUrl.value = proc.url || '';
    window.procUrlRe.checked = proc.urlIsRE || false;
    window.procShare.value = proc.share || '';
    window.procShareRe.checked = proc.shareIsRE || false;
    window.procProc.value = proc.proc || 'noOperation';
    window.procParam.value = proc.param || '';
    window.procPri.value = proc.priority || 0;
}
window.procList.addEventListener('change', changeProcList);

/**
 * URL 用 key の有効無効を切り替える。
 * itemUrlAsText のイベントハンドラ。
 */
function
switchUrlKey(e)
{
    window.itemUrlKey.disabled = e.target.checked;
}
window.itemUrlAsText.addEventListener('change', switchUrlKey);

/**
 * 要素を編集する。
 * modItem のイベントハンドラ。
 */
async function
modifyItem(e)
{
    e.preventDefault();
    const prevValue = e.submitter.value;
    e.submitter.disabled = true;
    e.submitter.value = '😁 待たれよ';

    const item = await Settings.getItem(window.itemList.value) || {};
    if (e.submitter.name === 'remove') {
        if (await dialog.confirm(`🛒 正気か？ ${item.name} は消えます‼️`)) {
            await Settings.removeItem(window.itemList.value);
        } else {
            e.submitter.value = prevValue;
            e.submitter.disabled = false;;
            return false;   /* don't reload */
        }
    } else {
        item.name = window.itemName.value;
        item.url = window.itemUrl.value;
        item.textKey = window.itemTextKey.value;
        item.urlKey = window.itemUrlAsText.checked ? null : window.itemUrlKey.value;
        if (window.itemList.value === 'newItem')
            await Settings.addItem(item);
        else
            await Settings.setItem(window.itemList.value, item);
    }

    window.location.reload();
    return false;
}
window.modItem.addEventListener('submit', modifyItem);

/**
 * 前処理の説明を表示する。
 * procHelp のイベントハンドラ。
 */
async function
showProcHelp(e)
{
    e.preventDefault();
    const mesg = PreProcs[window.procProc.value]() || 'なぞのばしょ\n説明を利用できません';
    const lines = mesg.split('\n').map(e => e.trim());

    const b = document.createElement('b');
    b.textContent = lines.shift();

    const p = document.createElement('p');
    p.textContent = lines.join('\n');

    const button = document.createElement('button');
    button.textContent = Math.random() < 0.1 ? 'わかったわかった' : 'わかった';
    button.addEventListener('click', _ => dialog.close(button.textContent));

    const div = document.createElement('div');
    div.style.textAlign = 'right';
    div.append(button);

    dialog.setContent(b, p, div);
    dialog.openModal();

    return false;
}
window.procHelp.addEventListener('click', showProcHelp);

/**
 * 前処理を編集する。
 * modPreProc のイベントハンドラ
 */
async function
modifyPreProc(e)
{
    e.preventDefault();
    const prevValue = e.submitter.value;
    e.submitter.disabled = true;
    e.submitter.value = '😁 待たれよ';

    const preProc = await Settings.getPreProc(window.procList.value) || {};
    if (e.submitter.name === 'remove') {
        if (await dialog.confirm(`🛒 正気か？ ${preProc.description} は消えます‼️`)) {
            await Settings.removePreProc(window.procList.value);
        } else {
            e.submitter.value = prevValue;
            e.submitter.disabled = false;;
            return false;   /* don't reload */
        }
    } else {
        preProc.description = window.procDesc.value;
        preProc.url = window.procUrl.value;
        preProc.urlIsRE = window.procUrlRe.checked;
        preProc.share = window.procShare.value;
        preProc.shareIsRE = window.procShareRe.checked;
        preProc.proc = window.procProc.value;
        preProc.param = window.procParam.value;
        preProc.priority = +window.procPri.value;
        if (window.procList.value === 'newProc')
            await Settings.addPreProc(preProc);
        else
            await Settings.setPreProc(window.procList.value, preProc);
    }

    window.location.reload();
    return false;
}
window.modPreProc.addEventListener('submit', modifyPreProc);
