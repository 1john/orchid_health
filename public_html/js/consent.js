/*
 * Orchid Health consent manager.
 *
 * Load synchronously and first in <head>:
 *   <link rel="stylesheet" href="/css/consent.css">
 *   <script src="/js/consent.js"></script>
 * Add data-analytics="off" to the script tag on pages where analytics must never run.
 *
 * Optional tracking (Google Analytics) is only loaded after the visitor explicitly
 * accepts. Nothing optional is requested before a choice, after Reject, or when the
 * browser sends a Global Privacy Control signal.
 */
(function (window, document) {
    'use strict';

    // GA4 measurement ID for the "Orchid Health" web stream (property 252076728). Set to 'G-XXXXXXXXXX' to disable GA.
    var GA_ID = 'G-J6LD7YL94P';
    var COOKIE_NAME = 'orchid_consent';
    var POLICY_VERSION = 1;
    var MAX_AGE = 60 * 60 * 24 * 365;
    var PRIVACY_POLICY_URL = 'https://docs.google.com/document/u/1/d/e/2PACX-1vTMjTylUDofitKDo7I0kFOrEvsB_cXQZTHy1PixCy2o-5dXQPQKe1kmUO6Ntsp03COVlojqDUP0TWF8/pub';

    var script = document.currentScript;
    var pageAllowsAnalytics = !(script && script.getAttribute('data-analytics') === 'off');
    var gaConfigured = /^G-[A-Z0-9]+$/.test(GA_ID) && !/^G-X+$/.test(GA_ID);
    var gpc = navigator.globalPrivacyControl === true;
    var gaLoaded = false;
    var banner, dialog;

    function baseDomain() {
        var host = window.location.hostname;
        return /(^|\.)orchidhealth\.org$/.test(host) ? '.orchidhealth.org' : '';
    }

    function readChoice() {
        var match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
        if (!match) return null;
        try {
            var value = JSON.parse(decodeURIComponent(match[1]));
            return value && value.v === POLICY_VERSION ? value : null;
        } catch (e) {
            return null;
        }
    }

    function writeChoice(analytics, source) {
        var value = { v: POLICY_VERSION, analytics: !!analytics, src: source, ts: new Date().toISOString() };
        var domain = baseDomain();
        document.cookie = COOKIE_NAME + '=' + encodeURIComponent(JSON.stringify(value)) +
            '; Max-Age=' + MAX_AGE + '; Path=/; SameSite=Lax' +
            (domain ? '; Domain=' + domain : '') +
            (window.location.protocol === 'https:' ? '; Secure' : '');
        return value;
    }

    function deleteAnalyticsCookies() {
        var host = window.location.hostname;
        var domains = ['', host, '.' + host, baseDomain()];
        var parts = host.split('.');
        if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
        document.cookie.split('; ').forEach(function (pair) {
            var name = pair.split('=')[0];
            if (name !== '_ga' && name.indexOf('_ga_') !== 0 && name !== '_gid' && name !== '_gat') return;
            domains.forEach(function (domain) {
                document.cookie = name + '=; Max-Age=0; Path=/' + (domain ? '; Domain=' + domain : '');
            });
        });
    }

    function analyticsActive(choice) {
        return !!(choice && choice.analytics && pageAllowsAnalytics && gaConfigured);
    }

    function loadAnalytics() {
        if (gaLoaded) return;
        gaLoaded = true;
        window['ga-disable-' + GA_ID] = false;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied'
        });
        window.gtag('consent', 'update', { analytics_storage: 'granted' });
        window.gtag('js', new Date());
        window.gtag('config', GA_ID, {
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });
        var tag = document.createElement('script');
        tag.async = true;
        tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
        document.head.appendChild(tag);
    }

    function stopAnalytics() {
        if (gaLoaded && window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
        window['ga-disable-' + GA_ID] = true;
        deleteAnalyticsCookies();
    }

    function applyChoice(analytics, source) {
        var wasLoaded = gaLoaded;
        var choice = writeChoice(analytics, source);
        hideBanner();
        if (analyticsActive(choice)) {
            loadAnalytics();
        } else {
            stopAnalytics();
            // gtag.js cannot be unloaded, so reload to guarantee no further optional tracking.
            if (wasLoaded) window.location.reload();
        }
    }

    function el(tag, attrs, html) {
        var node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
        if (html) node.innerHTML = html;
        return node;
    }

    function buildBanner() {
        banner = el('div', { 'class': 'oc-banner', role: 'region', 'aria-label': 'Privacy choices' },
            '<div class="oc-banner-inner">' +
                '<p class="oc-banner-text">We use strictly necessary storage to run this site. With your permission we would also use ' +
                'Google Analytics to understand how the site is used. Optional analytics stays off unless you choose Accept. ' +
                '<a href="' + PRIVACY_POLICY_URL + '" target="_blank" rel="noopener">Website Privacy Policy</a></p>' +
                '<div class="oc-actions">' +
                    '<button type="button" class="oc-btn" data-oc-action="accept">Accept</button>' +
                    '<button type="button" class="oc-btn" data-oc-action="reject">Reject</button>' +
                    '<button type="button" class="oc-btn oc-btn-secondary" data-oc-action="manage">Manage preferences</button>' +
                '</div>' +
            '</div>');
        document.body.appendChild(banner);
    }

    function hideBanner() {
        if (banner) banner.hidden = true;
    }

    function buildDialog() {
        var note = !pageAllowsAnalytics
            ? '<p class="oc-note">Analytics is never used on this page, whatever you choose.</p>'
            : '';
        dialog = el('dialog', { 'class': 'oc-dialog', 'aria-labelledby': 'oc-dialog-title' },
            '<div class="oc-dialog-header">' +
                '<h2 id="oc-dialog-title">Privacy settings</h2>' +
                '<button type="button" class="oc-close" data-oc-action="close" aria-label="Close without saving">&times;</button>' +
            '</div>' +
            '<p>Choose which optional technologies Orchid Health may use. You can change or withdraw your choice at any time ' +
            'using the Privacy settings link at the bottom of every page.</p>' +
            '<p class="oc-note oc-gpc" hidden>Your browser sent a Global Privacy Control signal, so optional analytics was turned off. ' +
            'You can still turn it on below if you wish.</p>' +
            '<div class="oc-category">' +
                '<div class="oc-category-head"><h3>Strictly necessary</h3><span class="oc-always">Always on</span></div>' +
                '<p>Remembers your privacy choice (cookie: orchid_consent, 12 months). No tracking.</p>' +
            '</div>' +
            '<div class="oc-category">' +
                '<div class="oc-category-head">' +
                    '<h3><label for="oc-analytics">Analytics (Google Analytics)</label></h3>' +
                    '<input type="checkbox" id="oc-analytics" class="oc-switch" role="switch">' +
                '</div>' +
                '<p>Measures pages visited and how the site is used, with advertising features, Google signals and ' +
                'remarketing turned off. Cookies: _ga, _ga_*. Off unless you turn it on.</p>' + note +
            '</div>' +
            '<div class="oc-actions">' +
                '<button type="button" class="oc-btn" data-oc-action="save">Save choices</button>' +
                '<button type="button" class="oc-btn" data-oc-action="accept">Accept all</button>' +
                '<button type="button" class="oc-btn" data-oc-action="reject">Reject all</button>' +
            '</div>');
        document.body.appendChild(dialog);
    }

    function openDialog() {
        if (!dialog) buildDialog();
        var choice = readChoice();
        dialog.querySelector('#oc-analytics').checked = !!(choice && choice.analytics);
        dialog.querySelector('.oc-gpc').hidden = !(choice && choice.src === 'gpc');
        if (typeof dialog.showModal === 'function') {
            if (!dialog.open) dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
        dialog.querySelector('#oc-analytics').focus();
    }

    function closeDialog() {
        if (!dialog) return;
        if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    }

    function loadEmbed(container) {
        var src = container.getAttribute('data-src');
        if (!src) return;
        var iframe = el('iframe', {
            src: src,
            title: container.getAttribute('data-title') || 'Embedded content',
            width: container.getAttribute('data-width') || '560',
            height: container.getAttribute('data-height') || '315',
            frameborder: '0',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            referrerpolicy: 'strict-origin-when-cross-origin',
            allowfullscreen: ''
        });
        container.innerHTML = '';
        container.appendChild(iframe);
        container.classList.add('oc-embed-loaded');
        iframe.focus();
    }

    function onClick(event) {
        var target = event.target.closest && event.target.closest('[data-oc-action], [data-consent-open], [data-consent-embed-play]');
        if (!target) return;
        if (target.hasAttribute('data-consent-open')) {
            event.preventDefault();
            openDialog();
            return;
        }
        if (target.hasAttribute('data-consent-embed-play')) {
            event.preventDefault();
            loadEmbed(target.closest('[data-consent-embed]'));
            return;
        }
        var source = target.closest('.oc-banner') ? 'banner' : 'settings';
        switch (target.getAttribute('data-oc-action')) {
            case 'accept': applyChoice(true, source); closeDialog(); break;
            case 'reject': applyChoice(false, source); closeDialog(); break;
            case 'save': applyChoice(dialog.querySelector('#oc-analytics').checked, 'settings'); closeDialog(); break;
            case 'manage': openDialog(); break;
            case 'close': closeDialog(); break;
        }
    }

    var initial = readChoice();
    if (!initial && gpc) initial = writeChoice(false, 'gpc');
    if (analyticsActive(initial)) loadAnalytics();
    else if (initial && !initial.analytics) deleteAnalyticsCookies();

    function initUi() {
        document.addEventListener('click', onClick);
        if (!initial) buildBanner();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUi);
    else initUi();

    window.OrchidConsent = {
        open: openDialog,
        get: readChoice
    };
})(window, document);
