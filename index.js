'use strict';

import Dialog from './dialog.js';
import * as Settings from './settings.js';

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

    dialog.close();

    if (! await Settings.getFlag('twitter2x') && ! await Settings.getSessionFlag('twitter2x'))
        await twitter2x(items);
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
    if (item.urlKey === null) {
        url.searchParams.set(item.textKey, tab.title + ' ' + tab.url);
    } else {
        url.searchParams.set(item.textKey, tab.title);
        url.searchParams.set(item.urlKey, tab.url);
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
