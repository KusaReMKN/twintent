'use strict';

import * as Settings from './settings.js';

/**
 * 要素を初期化する。
 * 読み込み完了時のイベントハンドラ。
 */
async function
initialize(_)
{
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
 *
 */
async function
modifyItem(e)
{
    e.preventDefault();
    e.submitter.disabled = true;
    e.submitter.value = '😁 待たれよ';

    const item = await Settings.getItem(window.itemList.value) || {};
    if (e.submitter.name === 'remove') {
        if (window.confirm(`🛒 正気か？ ${item.name} は消えます‼️`))
            await Settings.removeItem(window.itemList.value);
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
