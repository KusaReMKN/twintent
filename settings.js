'use strict';

/**
 * 新しい設定項目を追加する。
 *
 * @param { { name: string, url: string, textKey: string, urlKey: string | null } } item
 * 追加する項目
 */
export async function
addItem(item)
{
    await setItem(window.crypto.randomUUID(), item);
}

/**
 * 全てを消し去って初期状態に戻す。
 * chrome.storage に保存されている情報は全て削除される。
 *
 * @param { string } yes 正気なら 'yes'
 */
export async function
clear(yes)
{
    if (yes === 'yes')
        await chrome.storage.local.clear();
}

/**
 * 全ての設定項目の一覧を返す。
 *
 * @returns { Promise<{ name: string, url: string, textKey: string, urlKey: string | null }[]> }
 */
export async function
getAllItems()
{
    const settings = await chrome.storage.local.get();
    return settings.items;
}

/**
 * 指定された設定項目を返す。
 *
 * @param { string } id 要求する項目の識別子
 * @returns { Promise<{ name: string, url: string, textKey: string, urlKey: string | null } | undefined> }
 */
export async function
getItem(id)
{
    const items = await getAllItems();
    return items[id];
}

/**
 * 保存済の設定を現在のバージョンに移行する。
 * chrome.storage に保存されている情報は更新される。
 */
export async function
migrate()
{
    const manifest = chrome.runtime.getManifest();
    const settings = await chrome.storage.local.get();

    while (settings.version !== manifest.version)
        switch (settings.version) {
            case undefined:	/* first boot */
                const sampleItem = {
                    name: 'Twitter',
                    url: 'https://twitter.com/intent/tweet',
                    textKey: 'text',
                    urlKey: 'url',
                };
                settings.items = {};
                settings.items[window.crypto.randomUUID()] = sampleItem;
                settings.version = manifest.version;
                window.alert('🌪️ twintent をインストールしてくれてありがとう⁉️');
                break;
            default:	/* no need to migrate */
                settings.version = manifest.version;
        }
    await chrome.storage.local.set(settings);
}

/**
 * 指定した設定項目を削除する。
 *
 * @param { string } id 削除する項目の識別子
 */
export async function
removeItem(id)
{
    const settings = await chrome.storage.local.get();
    delete settings.items[id];
    await chrome.storage.local.set(settings);
}

/**
 * 指定した設定項目を更新する。
 *
 * @param { string } id 更新する項目の識別子
 * @param { { name: string, url: string, textKey: string, urlKey: string | null } } item
 * 更新するする項目
 */
export async function
setItem(id, item)
{
    const settings = await chrome.storage.local.get();
    settings.items[id] = item;
    await chrome.storage.local.set(settings);
}
