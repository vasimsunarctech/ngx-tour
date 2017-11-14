(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/common'), require('@angular/core'), require('@angular/router'), require('rxjs/add/operator/filter'), require('rxjs/add/operator/first'), require('rxjs/operator/map'), require('rxjs/operator/merge'), require('rxjs/Subject')) :
	typeof define === 'function' && define.amd ? define(['exports', '@angular/common', '@angular/core', '@angular/router', 'rxjs/add/operator/filter', 'rxjs/add/operator/first', 'rxjs/operator/map', 'rxjs/operator/merge', 'rxjs/Subject'], factory) :
	(factory((global['ngx-tour-core'] = {}),global.ng.common,global.ng.core,global.ng.router,global.Rx.Observable.prototype,global.Rx.Observable.prototype,global.Rx.Observable.prototype,global.Rx.Observable.prototype,global.Rx));
}(this, (function (exports,_angular_common,_angular_core,_angular_router,rxjs_add_operator_filter,rxjs_add_operator_first,rxjs_operator_map,rxjs_operator_merge,rxjs_Subject) { 'use strict';

var TourState = {};
TourState.OFF = 0;
TourState.ON = 1;
TourState.PAUSED = 2;
TourState[TourState.OFF] = "OFF";
TourState[TourState.ON] = "ON";
TourState[TourState.PAUSED] = "PAUSED";
var TourService = (function () {
    /**
     * @param {?} router
     */
    function TourService(router) {
        this.router = router;
        this.stepShow$ = new rxjs_Subject.Subject();
        this.stepHide$ = new rxjs_Subject.Subject();
        this.initialize$ = new rxjs_Subject.Subject();
        this.start$ = new rxjs_Subject.Subject();
        this.end$ = new rxjs_Subject.Subject();
        this.pause$ = new rxjs_Subject.Subject();
        this.resume$ = new rxjs_Subject.Subject();
        this.anchorRegister$ = new rxjs_Subject.Subject();
        this.anchorUnregister$ = new rxjs_Subject.Subject();
        this.events$ = rxjs_operator_merge.mergeStatic(rxjs_operator_map.map.bind(this.stepShow$)(function (value) { return ({ name: 'stepShow', value: value }); }), rxjs_operator_map.map.bind(this.stepHide$)(function (value) { return ({ name: 'stepHide', value: value }); }), rxjs_operator_map.map.bind(this.initialize$)(function (value) { return ({ name: 'initialize', value: value }); }), rxjs_operator_map.map.bind(this.start$)(function (value) { return ({ name: 'start', value: value }); }), rxjs_operator_map.map.bind(this.end$)(function (value) { return ({ name: 'end', value: value }); }), rxjs_operator_map.map.bind(this.pause$)(function (value) { return ({ name: 'pause', value: value }); }), rxjs_operator_map.map.bind(this.resume$)(function (value) { return ({ name: 'resume', value: value }); }), rxjs_operator_map.map.bind(this.anchorRegister$)(function (value) { return ({ name: 'anchorRegister', value: value }); }), rxjs_operator_map.map.bind(this.anchorUnregister$)(function (value) { return ({ name: 'anchorUnregister', value: value }); }));
        this.steps = [];
        this.anchors = {};
        this.status = TourState.OFF;
    }
    /**
     * @param {?} steps
     * @param {?=} stepDefaults
     * @return {?}
     */
    TourService.prototype.initialize = function (steps, stepDefaults) {
        if (steps && steps.length > 0) {
            this.status = TourState.OFF;
            this.steps = steps.map(function (step) { return Object.assign({}, stepDefaults, step); });
            this.initialize$.next(this.steps);
        }
    };
    /**
     * @return {?}
     */
    TourService.prototype.start = function () {
        this.startAt(0);
    };
    /**
     * @param {?} stepId
     * @return {?}
     */
    TourService.prototype.startAt = function (stepId) {
        var _this = this;
        this.status = TourState.ON;
        this.goToStep(this.loadStep(stepId));
        this.start$.next();
        this.router.events.filter(function (event) { return event instanceof _angular_router.NavigationStart; }).first().subscribe(function () {
            if (_this.currentStep) {
                _this.hideStep(_this.currentStep);
            }
        });
    };
    /**
     * @return {?}
     */
    TourService.prototype.end = function () {
        this.status = TourState.OFF;
        this.hideStep(this.currentStep);
        this.currentStep = undefined;
        this.end$.next();
    };
    /**
     * @return {?}
     */
    TourService.prototype.pause = function () {
        this.status = TourState.PAUSED;
        this.hideStep(this.currentStep);
        this.pause$.next();
    };
    /**
     * @return {?}
     */
    TourService.prototype.resume = function () {
        this.status = TourState.ON;
        this.showStep(this.currentStep);
        this.resume$.next();
    };
    /**
     * @param {?=} pause
     * @return {?}
     */
    TourService.prototype.toggle = function (pause) {
        if (pause) {
            if (this.currentStep) {
                this.pause();
            }
            else {
                this.resume();
            }
        }
        else {
            if (this.currentStep) {
                this.end();
            }
            else {
                this.start();
            }
        }
    };
    /**
     * @return {?}
     */
    TourService.prototype.next = function () {
        if (this.hasNext(this.currentStep)) {
            this.goToStep(this.loadStep(this.currentStep.nextStep || this.steps.indexOf(this.currentStep) + 1));
        }
    };
    /**
     * @param {?} step
     * @return {?}
     */
    TourService.prototype.hasNext = function (step) {
        if (!step) {
            console.warn('Can\'t get next step. No currentStep.');
            return false;
        }
        return step.nextStep !== undefined || this.steps.indexOf(step) < this.steps.length - 1;
    };
    /**
     * @return {?}
     */
    TourService.prototype.prev = function () {
        if (this.hasPrev(this.currentStep)) {
            this.goToStep(this.loadStep(this.currentStep.prevStep || this.steps.indexOf(this.currentStep) - 1));
        }
    };
    /**
     * @param {?} step
     * @return {?}
     */
    TourService.prototype.hasPrev = function (step) {
        if (!step) {
            console.warn('Can\'t get previous step. No currentStep.');
            return false;
        }
        return step.prevStep !== undefined || this.steps.indexOf(step) > 0;
    };
    /**
     * @param {?} stepId
     * @return {?}
     */
    TourService.prototype.goto = function (stepId) {
        this.goToStep(this.loadStep(stepId));
    };
    /**
     * @param {?} anchorId
     * @param {?} anchor
     * @return {?}
     */
    TourService.prototype.register = function (anchorId, anchor) {
        if (this.anchors[anchorId]) {
            throw new Error('anchorId ' + anchorId + ' already registered!');
        }
        this.anchors[anchorId] = anchor;
        this.anchorRegister$.next(anchorId);
    };
    /**
     * @param {?} anchorId
     * @return {?}
     */
    TourService.prototype.unregister = function (anchorId) {
        delete this.anchors[anchorId];
        this.anchorUnregister$.next(anchorId);
    };
    /**
     * @return {?}
     */
    TourService.prototype.getStatus = function () {
        return this.status;
    };
    /**
     * @param {?} step
     * @return {?}
     */
    TourService.prototype.goToStep = function (step) {
        var _this = this;
        if (!step) {
            console.warn('Can\'t go to non-existent step');
            this.end();
            return;
        }
        var /** @type {?} */ navigatePromise = new Promise(function (resolve) { return resolve(true); });
        if (step.route !== undefined && typeof (step.route) === 'string') {
            navigatePromise = this.router.navigateByUrl(step.route);
        }
        else if (step.route && Array.isArray(step.route)) {
            navigatePromise = this.router.navigate(step.route);
        }
        navigatePromise.then(function (navigated) {
            if (navigated !== false) {
                setTimeout(function () { return _this.setCurrentStep(step); });
            }
        });
    };
    /**
     * @param {?} stepId
     * @return {?}
     */
    TourService.prototype.loadStep = function (stepId) {
        if (typeof (stepId) === 'number') {
            return this.steps[stepId];
        }
        else {
            return this.steps.find(function (step) { return step.stepId === stepId; });
        }
    };
    /**
     * @param {?} step
     * @return {?}
     */
    TourService.prototype.setCurrentStep = function (step) {
        var _this = this;
        if (this.currentStep) {
            this.hideStep(this.currentStep);
        }
        this.currentStep = step;
        this.showStep(this.currentStep);
        this.router.events.filter(function (event) { return event instanceof _angular_router.NavigationStart; }).first().subscribe(function () {
            if (_this.currentStep) {
                _this.hideStep(_this.currentStep);
            }
        });
    };
    /**
     * @param {?} step
     * @return {?}
     */
    TourService.prototype.showStep = function (step) {
        var /** @type {?} */ anchor = this.anchors[step && step.anchorId];
        if (!anchor) {
            this.end();
            return;
        }
        anchor.showTourStep(step);
        this.stepShow$.next(step);
    };
    /**
     * @param {?} step
     * @return {?}
     */
    TourService.prototype.hideStep = function (step) {
        var /** @type {?} */ anchor = this.anchors[step && step.anchorId];
        if (!anchor) {
            return;
        }
        anchor.hideTourStep();
        this.stepHide$.next(step);
    };
    return TourService;
}());
TourService.decorators = [
    { type: _angular_core.Injectable },
];
/**
 * @nocollapse
 */
TourService.ctorParameters = function () { return [
    { type: _angular_router.Router, },
]; };
var TourHotkeyListenerComponent = (function () {
    /**
     * @param {?} tourService
     */
    function TourHotkeyListenerComponent(tourService) {
        this.tourService = tourService;
    }
    /**
     * Configures hot keys for controlling the tour with the keyboard
     * @param {?} event
     * @return {?}
     */
    TourHotkeyListenerComponent.prototype.onEscapeKey = function (event) {
        if (this.tourService.getStatus() === TourState.ON) {
            this.tourService.end();
        }
    };
    /**
     * @param {?} event
     * @return {?}
     */
    TourHotkeyListenerComponent.prototype.onArrowRightKey = function (event) {
        if (this.tourService.getStatus() === TourState.ON && this.tourService.hasNext(this.tourService.currentStep)) {
            this.tourService.next();
        }
    };
    /**
     * @param {?} event
     * @return {?}
     */
    TourHotkeyListenerComponent.prototype.onArrowLeftKey = function (event) {
        if (this.tourService.getStatus() === TourState.ON && this.tourService.hasPrev(this.tourService.currentStep)) {
            this.tourService.prev();
        }
    };
    return TourHotkeyListenerComponent;
}());
TourHotkeyListenerComponent.decorators = [
    { type: _angular_core.Component, args: [{
                selector: 'tour-hotkey-listener',
                template: " ",
            },] },
];
/**
 * @nocollapse
 */
TourHotkeyListenerComponent.ctorParameters = function () { return [
    { type: TourService, },
]; };
TourHotkeyListenerComponent.propDecorators = {
    'onEscapeKey': [{ type: _angular_core.HostListener, args: ['window:keydown.Escape',] },],
    'onArrowRightKey': [{ type: _angular_core.HostListener, args: ['window:keydown.ArrowRight',] },],
    'onArrowLeftKey': [{ type: _angular_core.HostListener, args: ['window:keydown.ArrowLeft',] },],
};
var TourModule = (function () {
    function TourModule() {
    }
    /**
     * @return {?}
     */
    TourModule.forRoot = function () {
        return {
            ngModule: TourModule,
            providers: [
                TourService,
            ],
        };
    };
    return TourModule;
}());
TourModule.decorators = [
    { type: _angular_core.NgModule, args: [{
                declarations: [TourHotkeyListenerComponent],
                exports: [TourHotkeyListenerComponent],
                imports: [_angular_common.CommonModule, _angular_router.RouterModule],
            },] },
];
/**
 * @nocollapse
 */
TourModule.ctorParameters = function () { return []; };

exports.TourModule = TourModule;
exports.TourService = TourService;
exports.TourState = TourState;
exports.TourHotkeyListenerComponent = TourHotkeyListenerComponent;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ngx-tour-core.umd.js.map
