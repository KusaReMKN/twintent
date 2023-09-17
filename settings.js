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
 * 新しい前処理項目を追加する。
 *
 * @param { { ... } } preProc 追加する項目
 */
export async function
addPreProc(preProc)
{
    await setPreProc(window.crypto.randomUUID(), preProc);
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
 * @returns { Promise<{ [key: string]: { name: string, url: string, textKey: string, urlKey: string | null } }> }
 */
export async function
getAllItems()
{
    const settings = await chrome.storage.local.get();
    return settings.items;
}

/**
 * 全ての前処理項目の一覧を返す。
 * @returns { Promise<{ [key: string]: { ... }> }
 */
export async function
getAllPreProcs()
{
    const settings = await chrome.storage.local.get();
    return settings.preProcs;
}

/**
 * 指定されたフラグ項目を返す。
 *
 * @param { string } id 要求する項目の識別子
 * @returns { Promise<boolean> }
 */
export async function
getFlag(id)
{
    const settings = await chrome.storage.local.get();
    return settings.flags[id] || false;
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
 * 指定された前処理項目を返す。
 *
 * @param { string } id 要求する項目の識別子
 * @returns { Promise<{ ... } | undefined> }
 */
export async function
getPreProc(id)
{
    const preProcs = await getAllPreProcs();
    return preProcs[id];
}

/**
 * 指定されたセッション限定のフラグ項目を返す。
 *
 * @param { string } id 要求する項目の識別子
 * @returns { Promise<boolean> }
 */
export async function
getSessionFlag(id)
{
    const settings = await chrome.storage.session.get();
    return settings.flags?.[id] || false;
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

    const sampleItem = {
        name: 'X (Twitter)',
        url: 'https://twitter.com/intent/tweet',
        textKey: 'text',
        urlKey: 'url',
    };
    const samplePreProc1 = {
        description: 'Twitter には YouTube のプレイリストを共有しない',
        url: 'youtube.com',
        urlIsRE: false,
        share: '(twitter|x)\.com',
        shareIsRE: true,
        proc: 'removeUrlParams',
        param: 'list, index, start_radio',
        priority: 100,
    };
    const samplePreProc2 = {
        description: 'YouTube の未確認の通知の数を隠す',
        url: 'youtube.com',
        urlIsRE: false,
        share: '',
        shareIsRE: false,
        proc: 'replaceText',
        param: 's/^\\(\\d+\\)\\s*/',
        priority: 100,
    };

    while (settings.version !== manifest.version)
        switch (settings.version) {
            case undefined: /* first boot */
                settings.items = {};
                settings.items[window.crypto.randomUUID()] = sampleItem;
                settings.flags = {};
                settings.flags['twitter2x'] = true;
                settings.flags['preprocs'] = true;
                settings.preProcs = {};
                settings.preProcs[window.crypto.randomUUID()] = samplePreProc1;
                settings.preProcs[window.crypto.randomUUID()] = samplePreProc2;
                settings.version = manifest.version;
                break;
            case '0.1.0':
            case '0.1.1':   /* last of v0.1.x */
                settings.flags = {};
                /* FALLTHROUGH */
            case '0.2.0':    /* last of v0.2.x */
                settings.preProcs = {};
                settings.preProcs[window.crypto.randomUUID()] = samplePreProc1;
                settings.preProcs[window.crypto.randomUUID()] = samplePreProc2;
                /* FALLTHROUGH */
            case '0.2.9':   /* beta */
            default:    /* no need to migrate */
                settings.version = manifest.version;
        }
    await chrome.storage.local.set(settings);
}

/**
 * 指定したフラグ項目を削除する。
 *
 * @param { string } id 削除する項目の識別子
 */
export async function
removeFlag(id)
{
    const settings = await chrome.storage.local.get();
    delete settings.flags[id];
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
 * 指定した前処理項目を削除する。
 *
 * @param { string } id 削除する項目の識別子
 */
export async function
removePreProc(id)
{
    const settings = await chrome.storage.local.get();
    delete settings.preProcs[id];
    await chrome.storage.local.set(settings);
}

/**
 * 指定したセッション限定のフラグ項目を削除する。
 *
 * @param { string } id 削除する項目の識別子
 */
export async function
removeSessionFlag(id)
{
    const settings = await chrome.storage.session.get();
    settings.flags = settings.flags || {};
    delete settings.flags[id];
    await chrome.storage.session.set(settings);
}

/**
 * 指定したフラグ項目を更新する。
 *
 * @param { string } id 更新する項目の識別子
 * @param { boolean } flag 更新する項目
 */
export async function
setFlag(id, flag)
{
    const settings = await chrome.storage.local.get();
    settings.flags[id] = flag;
    await chrome.storage.local.set(settings);
}

/**
 * 指定した設定項目を更新する。
 *
 * @param { string } id 更新する項目の識別子
 * @param { { name: string, url: string, textKey: string, urlKey: string | null } } item
 * 更新する項目
 */
export async function
setItem(id, item)
{
    const settings = await chrome.storage.local.get();
    settings.items[id] = item;
    await chrome.storage.local.set(settings);
}

/**
 * 指定した前処理項目を更新する。
 *
 * @param { string } id 更新する項目の識別子
 * @param { { ... } } preProc
 * 更新する項目
 */
export async function
setPreProc(id, preProc)
{
    const settings = await chrome.storage.local.get();
    settings.preProcs[id] = preProc;
    await chrome.storage.local.set(settings);
}

/**
 * 指定したセッション限定のフラグ項目を更新する。
 *
 * @param { string } id 更新する項目の識別子
 * @param { boolean } flag 更新する項目
 */
export async function
setSessionFlag(id, flag)
{
    const settings = await chrome.storage.session.get();
    settings.flags = settings.flags || {};
    settings.flags[id] = flag;
    await chrome.storage.session.set(settings);
}
