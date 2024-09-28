import {checkDb} from "static/src/db";
import {initializeEvents} from "static/src/dom";


$(document).ready(function () {
    checkDb();
    initializeEvents();
})
;