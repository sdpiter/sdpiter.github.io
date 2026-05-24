// Seasonvar Online Plugin for Lampa
// Версия: 1.0.0 (2026)
// Аналог online_mod.js — добавляет Seasonvar как балансер онлайн-просмотра
// Установка: Настройки → Расширения → Добавить плагин → вставить URL этого файла

(function () {
    'use strict';

    // ─── КОНСТАНТЫ ───────────────────────────────────────────────────────────────

    var PLUGIN_NAME    = 'seasonvar_online';
    var PLUGIN_TITLE   = 'Seasonvar Online';
    var PLUGIN_VERSION = '1.0.0';

    // Зеркала Seasonvar (можно менять в настройках)
    var DEFAULT_HOST  = 'https://seasonvar-enter.ru';
    var DEFAULT_HOST2 = 'https://seasonvar.ru';

    // CORS-прокси (для обхода блокировок)
    var CORS_PROXIES = [
        'https://cors.nb557.workers.dev/',
        'https://cors.fx666.workers.dev/',
        'https://cors557.deno.dev/'
    ];

    // ─── УТИЛИТЫ ─────────────────────────────────────────────────────────────────

    function getHost() {
        var custom = (Lampa.Storage.field(PLUGIN_NAME + '_host') || '').trim();
        if (custom) {
            if (custom.indexOf('://') === -1) custom = 'https://' + custom;
            if (custom.slice(-1) === '/') custom = custom.slice(0, -1);
            return custom;
        }
        return DEFAULT_HOST;
    }

    function useProxy() {
        return Lampa.Storage.field(PLUGIN_NAME + '_proxy') === true;
    }

    function getProxy() {
        var idx = Math.floor(Date.now() / 3600000) % CORS_PROXIES.length;
        return CORS_PROXIES[idx];
    }

    function buildUrl(path) {
        var host = getHost();
        var url  = host + path;
        if (useProxy()) url = getProxy() + url;
        return url;
    }

    function normalizeTitle(str) {
        return (str || '').toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[^a-zа-яе0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function titlesMatch(a, b) {
        return normalizeTitle(a) === normalizeTitle(b);
    }

    function titlesContain(a, b) {
        var na = normalizeTitle(a);
        var nb = normalizeTitle(b);
        return na.indexOf(nb) !== -1 || nb.indexOf(na) !== -1;
    }

    // ─── ЯЗЫК / ПЕРЕВОДЫ ─────────────────────────────────────────────────────────

    function initLang() {
        var lang = {
            ru: {
                seasonvar_online_watch:       'Смотреть онлайн (Seasonvar)',
                seasonvar_online_searching:   'Поиск на Seasonvar...',
                seasonvar_online_not_found:   'Сериал не найден на Seasonvar',
                seasonvar_online_error:       'Ошибка загрузки с Seasonvar',
                seasonvar_online_select:      'Выберите сезон / серию',
                seasonvar_online_season:      'Сезон',
                seasonvar_online_episode:     'Серия',
                seasonvar_online_loading:     'Загрузка...',
                seasonvar_online_settings:    'Seasonvar Online — Настройки',
                seasonvar_online_host:        'Зеркало Seasonvar (хост)',
                seasonvar_online_proxy:       'Использовать CORS-прокси',
                seasonvar_online_api_key:     'API-ключ Seasonvar (премиум)',
                seasonvar_online_clear:       'Очистить кэш поиска',
            },
            en: {
                seasonvar_online_watch:       'Watch online (Seasonvar)',
                seasonvar_online_searching:   'Searching Seasonvar...',
                seasonvar_online_not_found:   'Serial not found on Seasonvar',
                seasonvar_online_error:       'Seasonvar load error',
                seasonvar_online_select:      'Select season / episode',
                seasonvar_online_season:      'Season',
                seasonvar_online_episode:     'Episode',
                seasonvar_online_loading:     'Loading...',
                seasonvar_online_settings:    'Seasonvar Online — Settings',
                seasonvar_online_host:        'Seasonvar mirror (host)',
                seasonvar_online_proxy:       'Use CORS proxy',
                seasonvar_online_api_key:     'Seasonvar API key (premium)',
                seasonvar_online_clear:       'Clear search cache',
            }
        };

        Lampa.Lang.add(lang);
    }

    // ─── НАСТРОЙКИ ────────────────────────────────────────────────────────────────

    function addSettingsFolder() {
        if (!Lampa.Settings.main || !Lampa.Settings.main()) return;
        if (Lampa.Settings.main().render().find('[data-component="' + PLUGIN_NAME + '"]').length) return;

        var icon = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" height="56">'
            + '<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="white" opacity=".15"/>'
            + '<path d="M10 8l6 4-6 4V8z" fill="white"/>'
            + '<circle cx="12" cy="12" r="10" stroke="white" stroke-width="1.5" fill="none"/>'
            + '</svg>';

        var field = $('<div class="settings-folder selector" data-component="' + PLUGIN_NAME + '">'
            + '<div class="settings-folder__icon">' + icon + '</div>'
            + '<div class="settings-folder__name">' + Lampa.Lang.translate('seasonvar_online_settings') + '</div>'
            + '</div>');

        Lampa.Settings.main().render().find('[data-component="more"]').after(field);
        Lampa.Settings.main().update();
    }

    function initSettings() {
        var template = '<div>'
            + '<div class="settings-param selector" data-name="' + PLUGIN_NAME + '_host" data-type="input" placeholder="' + DEFAULT_HOST + '">'
            +   '<div class="settings-param__name">#{seasonvar_online_host}</div>'
            +   '<div class="settings-param__value"></div>'
            + '</div>'
            + '<div class="settings-param selector" data-name="' + PLUGIN_NAME + '_proxy" data-type="toggle">'
            +   '<div class="settings-param__name">#{seasonvar_online_proxy}</div>'
            +   '<div class="settings-param__value"></div>'
            + '</div>'
            + '<div class="settings-param selector" data-name="' + PLUGIN_NAME + '_api_key" data-type="input" data-string="true" placeholder="">'
            +   '<div class="settings-param__name">#{seasonvar_online_api_key}</div>'
            +   '<div class="settings-param__value"></div>'
            + '</div>'
            + '<div class="settings-param selector" data-name="' + PLUGIN_NAME + '_clear_cache" data-static="true">'
            +   '<div class="settings-param__name">#{seasonvar_online_clear}</div>'
            +   '<div class="settings-param__status"></div>'
            + '</div>'
            + '</div>';

        Lampa.Template.add('settings_' + PLUGIN_NAME, template);

        if (window.appready) {
            addSettingsFolder();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') addSettingsFolder();
            });
        }

        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name === PLUGIN_NAME) {
                var btn = e.body.find('[data-name="' + PLUGIN_NAME + '_clear_cache"]');
                btn.unbind('hover:enter').on('hover:enter', function () {
                    try { localStorage.removeItem(PLUGIN_NAME + '_cache'); } catch (ex) {}
                    Lampa.Storage.set(PLUGIN_NAME + '_cache', '{}');
                    var st = $('.settings-param__status', btn);
                    st.removeClass('active error wait').addClass('active');
                    setTimeout(function () { st.removeClass('active'); }, 2000);
                });
            }
        });
    }

    // ─── SEASONVAR API ────────────────────────────────────────────────────────────

    /**
     * Автодополнение / поиск по названию.
     * Возвращает массив объектов: { id, title, orig_title, year, seasons, url }
     */
    function apiAutocomplete(query, network, onSuccess, onError) {
        var url = buildUrl('/autocomplete.php');
        var postdata = 'query=' + encodeURIComponent(query);

        network.clear();
        network.timeout(10000);
        network.silent(url, function (json) {
            if (!json || !json.length) {
                onSuccess([]);
                return;
            }
            var results = [];
            json.forEach(function (item) {
                // Seasonvar autocomplete возвращает: { id, title, orig_title, year, seasons, poster }
                results.push({
                    id:         item.id || item.sid,
                    title:      item.title || item.name || '',
                    orig_title: item.orig_title || item.original_name || '',
                    year:       item.year || 0,
                    seasons:    item.seasons || 1,
                    url:        item.link || item.url || ''
                });
            });
            onSuccess(results);
        }, function (a, c) {
            onError(network.errorDecode(a, c));
        }, postdata, { dataType: 'json' });
    }

    /**
     * Загрузка страницы сериала → получаем список сезонов + эпизодов.
     * seasonvar.ru/serial-<id>-<slug>-<N>-season.html
     */
    function apiLoadSerial(serialId, serialUrl, network, onSuccess, onError) {
        var url;
        if (serialUrl && serialUrl.indexOf('://') !== -1) {
            url = useProxy() ? getProxy() + serialUrl : serialUrl;
        } else {
            url = buildUrl('/serial-' + serialId + '-season.html');
        }

        var apiKey = (Lampa.Storage.field(PLUGIN_NAME + '_api_key') || '').trim();

        // Если есть API-ключ — используем официальный API
        if (apiKey) {
            var apiUrl = buildUrl('/?mod=api&query=serial&id=' + serialId + '&key=' + encodeURIComponent(apiKey));
            if (useProxy()) apiUrl = getProxy() + apiUrl;

            network.clear();
            network.timeout(12000);
            network.silent(apiUrl, function (json) {
                if (json && json.playlist) {
                    onSuccess(parseApiPlaylist(json));
                } else {
                    // fallback — scrape
                    scrapeSerial(serialId, serialUrl, network, onSuccess, onError);
                }
            }, function () {
                scrapeSerial(serialId, serialUrl, network, onSuccess, onError);
            }, false, { dataType: 'json' });
        } else {
            scrapeSerial(serialId, serialUrl, network, onSuccess, onError);
        }
    }

    /**
     * Парсинг официального API-ответа
     */
    function parseApiPlaylist(json) {
        var seasons = [];
        var playlist = json.playlist;
        if (!Array.isArray(playlist)) playlist = [playlist];

        playlist.forEach(function (seasonBlock) {
            var episodes = [];
            var eps = seasonBlock.playlist || [];
            eps.forEach(function (ep) {
                episodes.push({
                    title:   ep.title || ep.comment || '',
                    episode: ep.episode || ep.id || 0,
                    file:    ep.file || ep.link || ''
                });
            });
            seasons.push({
                season:   seasonBlock.season || seasonBlock.id || 1,
                title:    seasonBlock.title || ('Сезон ' + (seasonBlock.season || 1)),
                episodes: episodes
            });
        });

        return seasons;
    }

    /**
     * Скрапинг HTML-страницы Seasonvar для получения плейлиста
     */
    function scrapeSerial(serialId, serialUrl, network, onSuccess, onError) {
        var url;
        if (serialUrl && serialUrl.indexOf('://') !== -1) {
            url = useProxy() ? getProxy() + serialUrl : serialUrl;
        } else {
            url = buildUrl('/serial-' + serialId + '-season.html');
        }

        network.clear();
        network.timeout(15000);
        network.silent(url, function (html) {
            if (typeof html !== 'string') html = (html && (html.body || html.data || '')) + '';

            var seasons = [];

            // Пробуем найти ссылки на все сезоны
            var seasonLinks = [];
            var re = /href="(\/serial-\d+-[^"]*-(\d+)-season\.html)"/g;
            var m;
            while ((m = re.exec(html)) !== null) {
                var sNum = parseInt(m[2], 10);
                if (!seasonLinks.find(function (s) { return s.num === sNum; })) {
                    seasonLinks.push({ num: sNum, path: m[1] });
                }
            }

            // Парсим текущую страницу — ищем playlist.js или data-playlist
            var playlistMatch = html.match(/pl\/playlist_(\d+)\.js/);
            var currentSeason = parseInt((html.match(/class="sel-season[^>]*data-season="(\d+)"/) || [])[1] || '1', 10);

            if (!seasonLinks.length && !playlistMatch) {
                // Попытка найти сезоны из nav-меню
                var navRe = /<a[^>]+href="([^"]*season\.html)"[^>]*>Сезон\s*(\d+)/g;
                while ((m = navRe.exec(html)) !== null) {
                    var n = parseInt(m[2], 10);
                    if (!seasonLinks.find(function (s) { return s.num === n; })) {
                        seasonLinks.push({ num: n, path: m[1] });
                    }
                }
            }

            // Если нашли ссылки на сезоны — грузим каждый
            if (seasonLinks.length > 0) {
                var pending = seasonLinks.length;
                var seasonData = [];

                function checkDone() {
                    if (--pending === 0) {
                        seasonData.sort(function (a, b) { return a.season - b.season; });
                        onSuccess(seasonData);
                    }
                }

                seasonLinks.forEach(function (sLink) {
                    var sUrl = useProxy()
                        ? getProxy() + getHost() + sLink.path
                        : getHost() + sLink.path;

                    var net2 = new Lampa.Reguest();
                    net2.timeout(12000);
                    net2.silent(sUrl, function (sHtml) {
                        if (typeof sHtml !== 'string') sHtml = (sHtml && (sHtml.body || sHtml.data || '')) + '';
                        var episodes = scrapeEpisodes(sHtml, sLink.num);
                        seasonData.push({ season: sLink.num, title: 'Сезон ' + sLink.num, episodes: episodes });
                        checkDone();
                    }, function () {
                        seasonData.push({ season: sLink.num, title: 'Сезон ' + sLink.num, episodes: [] });
                        checkDone();
                    }, false, { dataType: 'text' });
                });
            } else {
                // Только один сезон — парсим текущий
                var episodes = scrapeEpisodes(html, currentSeason || 1);
                seasons.push({ season: currentSeason || 1, title: 'Сезон ' + (currentSeason || 1), episodes: episodes });
                onSuccess(seasons);
            }
        }, function (a, c) {
            onError(network.errorDecode(a, c));
        }, false, { dataType: 'text' });
    }

    /**
     * Из HTML одного сезона извлекаем список серий и их playlist URL
     */
    function scrapeEpisodes(html, seasonNum) {
        var episodes = [];

        // Вариант 1: playlist_{id}.js
        var plMatch = html.match(/pl\/playlist_(\d+)\.js/);
        if (plMatch) {
            // Playlist-файл содержит JSON с серией ссылок
            // Мы вернём один «элемент» — весь сезон через плейлист
            episodes.push({
                title:       'Сезон ' + seasonNum,
                episode:     0,
                playlist_id: plMatch[1],
                type:        'playlist'
            });
            return episodes;
        }

        // Вариант 2: iframe embed
        var iframeMatch = html.match(/src="(https?:\/\/[^"]*(?:player|embed|iframe)[^"]*)"[^>]*>/i);
        if (iframeMatch) {
            episodes.push({
                title:   'Сезон ' + seasonNum,
                episode: 0,
                iframe:  iframeMatch[1],
                type:    'iframe'
            });
            return episodes;
        }

        // Вариант 3: data-playlist или data-file в тегах
        var dataRe = /data-(?:file|src|playlist|href)="([^"]*\.(?:m3u8|mp4)[^"]*)"/gi;
        var dm;
        var epNum = 1;
        while ((dm = dataRe.exec(html)) !== null) {
            episodes.push({
                title:   'Серия ' + epNum,
                episode: epNum,
                file:    dm[1],
                type:    'file'
            });
            epNum++;
        }

        if (!episodes.length) {
            // Последний шанс: ищем ссылки типа /serial/.../episode-N.html
            var epRe = /href="(\/serial[^"]*episode-(\d+)[^"]*)"[^>]*>([^<]+)</g;
            var em;
            while ((em = epRe.exec(html)) !== null) {
                var eNum = parseInt(em[2], 10);
                episodes.push({
                    title:   'Серия ' + eNum,
                    episode: eNum,
                    url:     em[1],
                    type:    'page'
                });
            }
        }

        return episodes;
    }

    /**
     * Загружаем playlist_{id}.js — возвращает массив объектов {title, file}
     */
    function loadPlaylist(playlistId, network, onSuccess, onError) {
        var url = buildUrl('/pl/playlist_' + playlistId + '.js');

        network.clear();
        network.timeout(10000);
        network.silent(url, function (data) {
            var items = [];

            if (Array.isArray(data)) {
                data.forEach(function (ep, i) {
                    items.push({
                        title:   ep.title || ep.comment || ('Серия ' + (i + 1)),
                        episode: i + 1,
                        file:    ep.file || ep.link || '',
                        type:    'file'
                    });
                });
            } else if (typeof data === 'string') {
                // Иногда возвращается JSONP-подобная строка
                var match = data.match(/\[[\s\S]*\]/);
                if (match) {
                    try {
                        var arr = JSON.parse(match[0]);
                        arr.forEach(function (ep, i) {
                            items.push({
                                title:   ep.title || ep.comment || ('Серия ' + (i + 1)),
                                episode: i + 1,
                                file:    ep.file || ep.link || '',
                                type:    'file'
                            });
                        });
                    } catch (ex) {}
                }
            }

            onSuccess(items);
        }, function (a, c) {
            onError(network.errorDecode ? network.errorDecode(a, c) : 'Ошибка загрузки плейлиста');
        }, false, { dataType: 'json' });
    }

    // ─── КОМПОНЕНТ (UI) ──────────────────────────────────────────────────────────

    /**
     * Компонент Lampa для отображения сезонов/серий Seasonvar.
     * object — объект фильма/сериала из TMDB (содержит .movie, .search и т.д.)
     */
    function SeasonvarComponent(object) {
        var comp     = this;
        var network  = new Lampa.Reguest();
        var scroll   = new Lampa.Scroll({ mask: true, over: true });
        var items    = [];
        var started  = false;

        this.create = function () {
            scroll.render().addClass('layer--wheight');
            return scroll.render()[0];
        };

        this.render = function () {
            return scroll.render();
        };

        this.start = function () {
            if (started) return;
            started = true;
            comp.loading(true);
            comp.doSearch();
        };

        this.loading = function (state) {
            if (state) {
                var loader = $('<div class="broadcast__scan" style="position:relative;height:4em;">'
                    + '<div class="broadcast__scan-line"></div>'
                    + '</div>');
                scroll.render().empty().append(loader);
            }
        };

        this.doSearch = function () {
            var movie = object.movie || {};
            var query = object.search || movie.name || movie.title || movie.original_title || movie.original_name || '';

            if (!query) {
                comp.showEmpty('seasonvar_online_not_found');
                return;
            }

            Lampa.Noty.show(Lampa.Lang.translate('seasonvar_online_searching'));

            apiAutocomplete(query, network, function (results) {
                if (!results || !results.length) {
                    // Пробуем оригинальное название
                    var orig = movie.original_title || movie.original_name || '';
                    if (orig && orig !== query) {
                        apiAutocomplete(orig, network, function (r2) {
                            if (!r2 || !r2.length) {
                                comp.showEmpty('seasonvar_online_not_found');
                            } else {
                                comp.pickBestResult(r2, movie, query);
                            }
                        }, function () {
                            comp.showEmpty('seasonvar_online_not_found');
                        });
                    } else {
                        comp.showEmpty('seasonvar_online_not_found');
                    }
                    return;
                }
                comp.pickBestResult(results, movie, query);
            }, function (err) {
                comp.showError(err);
            });
        };

        this.pickBestResult = function (results, movie, query) {
            var year  = movie.release_date  && parseInt(movie.release_date, 10)
                     || movie.first_air_date && parseInt(movie.first_air_date, 10)
                     || 0;

            // Сначала ищем точное совпадение по названию + год
            var best = null;
            results.forEach(function (r) {
                if (!best) {
                    if (titlesMatch(r.title, query) || titlesMatch(r.orig_title, query)) {
                        if (!year || !r.year || Math.abs(r.year - year) <= 1) {
                            best = r;
                        }
                    }
                }
            });

            // Если не нашли точное — берём ближайшее по году
            if (!best) {
                results.forEach(function (r) {
                    if (!best && titlesContain(r.title, query)) {
                        best = r;
                    }
                });
            }

            // Берём первый результат
            if (!best) best = results[0];

            if (results.length > 1) {
                // Показываем список для выбора
                comp.showResultList(results, best);
            } else {
                comp.loadSerial(best);
            }
        };

        this.showResultList = function (results, preselected) {
            scroll.render().empty();
            var head = $('<div class="online-head"><div class="online-head__title">'
                + Lampa.Lang.translate('seasonvar_online_select')
                + '</div></div>');
            scroll.render().append(head);

            results.forEach(function (r) {
                var item = $('<div class="selector online-item">'
                    + '<div class="online-item__title">' + Lampa.Utils.escape(r.title || r.orig_title) + '</div>'
                    + '<div class="online-item__info">'
                    + (r.orig_title ? r.orig_title + ' ' : '')
                    + (r.year ? '(' + r.year + ')' : '')
                    + (r.seasons ? ' · ' + r.seasons + ' сезонов' : '')
                    + '</div>'
                    + '</div>');

                if (r === preselected) item.addClass('active');

                item.on('hover:enter', function () {
                    comp.loadSerial(r);
                });
                scroll.append(item);
                items.push(item);
            });

            scroll.update();
            if (preselected) {
                setTimeout(function () { comp.loadSerial(preselected); }, 700);
            }
        };

        this.loadSerial = function (serialInfo) {
            comp.loading(true);

            apiLoadSerial(serialInfo.id, serialInfo.url, network, function (seasons) {
                if (!seasons || !seasons.length) {
                    comp.showEmpty('seasonvar_online_not_found');
                    return;
                }
                if (seasons.length === 1) {
                    comp.showEpisodes(seasons[0], seasons, serialInfo);
                } else {
                    comp.showSeasons(seasons, serialInfo);
                }
            }, function (err) {
                comp.showError(err);
            });
        };

        this.showSeasons = function (seasons, serialInfo) {
            scroll.render().empty();
            items = [];

            var head = $('<div class="online-head"><div class="online-head__title">'
                + Lampa.Utils.escape(serialInfo.title || '') + '</div></div>');
            scroll.render().append(head);

            seasons.forEach(function (season) {
                var item = $('<div class="selector online-item">'
                    + '<div class="online-item__title">'
                    + Lampa.Lang.translate('seasonvar_online_season') + ' ' + season.season
                    + '</div>'
                    + '<div class="online-item__info">'
                    + (season.episodes ? season.episodes.length + ' серий' : '')
                    + '</div>'
                    + '</div>');

                item.on('hover:enter', function () {
                    comp.showEpisodes(season, seasons, serialInfo);
                });

                scroll.append(item);
                items.push(item);
            });

            scroll.update();
            Lampa.Controller.enable('content');
        };

        this.showEpisodes = function (season, allSeasons, serialInfo) {
            // Если это «плейлист» — грузим сначала список серий
            if (season.episodes.length === 1 && season.episodes[0].type === 'playlist') {
                comp.loading(true);
                var epInfo = season.episodes[0];
                loadPlaylist(epInfo.playlist_id, network, function (eps) {
                    if (!eps.length) {
                        comp.showEmpty('seasonvar_online_not_found');
                        return;
                    }
                    season.episodes = eps;
                    comp.renderEpisodes(season, allSeasons, serialInfo);
                }, function (err) {
                    comp.showError(err);
                });
                return;
            }

            comp.renderEpisodes(season, allSeasons, serialInfo);
        };

        this.renderEpisodes = function (season, allSeasons, serialInfo) {
            scroll.render().empty();
            items = [];

            var head = $('<div class="online-head">'
                + '<div class="online-head__title">'
                + Lampa.Utils.escape(serialInfo.title || '')
                + ' — ' + Lampa.Lang.translate('seasonvar_online_season') + ' ' + season.season
                + '</div>'
                + '</div>');

            // Кнопка «Назад к сезонам»
            if (allSeasons.length > 1) {
                var backBtn = $('<div class="selector online-item online-item--back">'
                    + '<div class="online-item__title">← Все сезоны</div>'
                    + '</div>');
                backBtn.on('hover:enter', function () {
                    comp.showSeasons(allSeasons, serialInfo);
                });
                scroll.render().append(head).append(backBtn);
            } else {
                scroll.render().append(head);
            }

            season.episodes.forEach(function (ep) {
                var item = $('<div class="selector online-item">'
                    + '<div class="online-item__title">'
                    + Lampa.Utils.escape(ep.title || (Lampa.Lang.translate('seasonvar_online_episode') + ' ' + ep.episode))
                    + '</div>'
                    + '</div>');

                item.on('hover:enter', function () {
                    comp.playEpisode(ep, season, serialInfo);
                });

                scroll.append(item);
                items.push(item);
            });

            scroll.update();
            Lampa.Controller.enable('content');
        };

        this.playEpisode = function (ep, season, serialInfo) {
            if (ep.type === 'iframe' && ep.iframe) {
                // Iframe-плеер — открываем через встроенный iframe Lampa
                var iframeUrl = ep.iframe;
                if (useProxy()) iframeUrl = getProxy() + iframeUrl;

                Lampa.Player.play({
                    url:    iframeUrl,
                    title:  (serialInfo.title || '') + ' — С' + season.season + ' ' + ep.title,
                    iframe: true
                });

            } else if (ep.type === 'file' && ep.file) {
                // Прямой URL файла (m3u8/mp4)
                var fileUrl = ep.file;
                if (fileUrl.indexOf('://') === -1) {
                    fileUrl = getHost() + fileUrl;
                }

                // Множество качеств могут быть перечислены через [480p]url[720p]url2
                var qualities = parseQualities(fileUrl);

                Lampa.Player.play({
                    url:    qualities.length ? qualities[0].url : fileUrl,
                    title:  (serialInfo.title || '') + ' — С' + season.season + 'Е' + ep.episode,
                    quality: qualities.length > 1 ? qualities : undefined
                });

            } else if (ep.type === 'page' && ep.url) {
                // Нужно загрузить страницу серии и найти плеер
                comp.loading(true);
                var pageUrl = useProxy()
                    ? getProxy() + getHost() + ep.url
                    : getHost() + ep.url;

                network.clear();
                network.timeout(12000);
                network.silent(pageUrl, function (html) {
                    if (typeof html !== 'string') html = (html && (html.body || html.data || '')) + '';

                    var fileMatch = html.match(/(?:data-file|file)="([^"]*\.(?:m3u8|mp4)[^"]*)"/i);
                    var iframeMatch = html.match(/src="(https?:\/\/[^"]*(?:player|embed|iframe)[^"]*)"[^>]*>/i);

                    if (fileMatch) {
                        var q = parseQualities(fileMatch[1]);
                        Lampa.Player.play({
                            url:    q.length ? q[0].url : fileMatch[1],
                            title:  ep.title,
                            quality: q.length > 1 ? q : undefined
                        });
                    } else if (iframeMatch) {
                        Lampa.Player.play({
                            url:    iframeMatch[1],
                            title:  ep.title,
                            iframe: true
                        });
                    } else {
                        Lampa.Noty.show(Lampa.Lang.translate('seasonvar_online_error'));
                    }
                }, function () {
                    Lampa.Noty.show(Lampa.Lang.translate('seasonvar_online_error'));
                }, false, { dataType: 'text' });

            } else {
                Lampa.Noty.show(Lampa.Lang.translate('seasonvar_online_error'));
            }
        };

        this.showEmpty = function (langKey) {
            scroll.render().empty();
            var empty = $('<div class="empty">'
                + '<div class="empty__title">' + Lampa.Lang.translate(langKey || 'seasonvar_online_not_found') + '</div>'
                + '</div>');
            scroll.render().append(empty);
            Lampa.Controller.enable('content');
        };

        this.showError = function (msg) {
            Lampa.Noty.show(msg || Lampa.Lang.translate('seasonvar_online_error'));
            comp.showEmpty('seasonvar_online_error');
        };

        this.back = function () {
            Lampa.Activity.backward();
        };

        this.pause  = function () {};
        this.resume = function () {};

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items = [];
        };
    }

    // ─── ПАРСИНГ КАЧЕСТВА ────────────────────────────────────────────────────────

    /**
     * Из строки вида "[360p]url1[720p]url2[1080p]url3" получаем массив качеств
     */
    function parseQualities(fileStr) {
        var result = [];
        var re = /\[(\d+p)\](https?:\/\/[^\[]+)/gi;
        var m;
        while ((m = re.exec(fileStr)) !== null) {
            result.push({ title: m[1], url: m[2].trim() });
        }
        // Если не в формате с метками — возвращаем один элемент
        if (!result.length && fileStr && fileStr.indexOf('://') !== -1) {
            result.push({ title: 'Auto', url: fileStr.trim() });
        }
        return result;
    }

    // ─── РЕГИСТРАЦИЯ В LAMPA ─────────────────────────────────────────────────────

    function initMain() {
        // Добавляем кнопку «Смотреть онлайн (Seasonvar)» в карточку сериала
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;

            var el   = e.object;
            var card = el.activity ? el.activity.render() : null;
            if (!card) return;

            // Не добавляем кнопку дважды
            if (card.find('.seasonvar-online-btn').length) return;

            var btn = $('<div class="full-start__button selector seasonvar-online-btn" style="margin-top:.6em;">'
                + '<div class="full-start__button-icon">'
                + '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" height="1.4em">'
                + '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>'
                + '<path d="M10 8.5l5 3.5-5 3.5V8.5z" fill="currentColor"/>'
                + '</svg>'
                + '</div>'
                + '<div class="full-start__button-text">'
                + Lampa.Lang.translate('seasonvar_online_watch')
                + '</div>'
                + '</div>');

            btn.on('hover:enter', function () {
                Lampa.Activity.push({
                    url:        '',
                    title:      PLUGIN_TITLE,
                    component:  PLUGIN_NAME,
                    search:     (el.movie && (el.movie.name || el.movie.title)) || '',
                    movie:      el.movie || {},
                    clarification: false
                });
            });

            // Вставляем кнопку после кнопки «Смотреть»
            var watchBtn = card.find('.full-start__button').first();
            if (watchBtn.length) {
                watchBtn.after(btn);
            } else {
                card.find('.full-start__buttons').append(btn);
            }
        });

        // Регистрируем компонент
        Lampa.Component.add(PLUGIN_NAME, SeasonvarComponent);
    }

    // ─── ЗАПУСК ──────────────────────────────────────────────────────────────────

    function startPlugin() {
        try {
            initLang();
            initMain();
            initSettings();
            console.log('[' + PLUGIN_NAME + '] v' + PLUGIN_VERSION + ' загружен');
        } catch (ex) {
            console.error('[' + PLUGIN_NAME + '] Ошибка инициализации:', ex);
        }
    }

    // Ждём готовности Lampa
    if (window.Lampa) {
        startPlugin();
    } else {
        // Lampa ещё не загружена — ждём события
        var checkInterval = setInterval(function () {
            if (window.Lampa && Lampa.Listener) {
                clearInterval(checkInterval);
                startPlugin();
            }
        }, 100);

        // Страховка — через 10 секунд сдаёмся
        setTimeout(function () { clearInterval(checkInterval); }, 10000);
    }

})();
