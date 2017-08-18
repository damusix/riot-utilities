'use strict';

import * as Beautify from './lib/prettifier';

import { Observer } from './lib/observer';
import * as ActionForms from './lib/action-forms';
import './tags';

const RiotUtils = {

    Observer,
    ActionForms,
    Beautify
}

global.RiotUtils = RiotUtils;
