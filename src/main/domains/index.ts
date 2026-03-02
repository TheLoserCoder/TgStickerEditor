/**
 * Импорты доменов для авторегистрации в контейнере
 * Порядок важен: core → ipc → logger → error → store → bot → settings → filesystem → temp-file → sticker-pack → image-processing
 */

import './core';
import './ipc';
import './logger';
import './error';
import './store';
import '../utils/id-generator';
import './bot';
import './settings';
import './editor-preset';
import './filesystem';
import './temp-file';
import './grid';
import './sticker-pack';
import './task-balancer';
import './pipeline';
import './media-processing';
import './image-processing';
import './sticker-downloader';
import './telegram';
