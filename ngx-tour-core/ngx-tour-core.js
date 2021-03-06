import { CommonModule } from '@angular/common';
import { Component, HostListener, Injectable, NgModule } from '@angular/core';
import { NavigationStart, Router, RouterModule } from '@angular/router';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/first';
import { map } from 'rxjs/operator/map';
import { mergeStatic } from 'rxjs/operator/merge';
import { Subject } from 'rxjs/Subject';

let TourState = {};
TourState.OFF = 0;
TourState.ON = 1;
TourState.PAUSED = 2;
TourState[TourState.OFF] = "OFF";
TourState[TourState.ON] = "ON";
TourState[TourState.PAUSED] = "PAUSED";
class TourService {
    /**
     * @param {?} router
     */
    constructor(router) {
        this.router = router;
        this.stepShow$ = new Subject();
        this.stepHide$ = new Subject();
        this.initialize$ = new Subject();
        this.start$ = new Subject();
        this.end$ = new Subject();
        this.pause$ = new Subject();
        this.resume$ = new Subject();
        this.anchorRegister$ = new Subject();
        this.anchorUnregister$ = new Subject();
        this.events$ = mergeStatic(map.bind(this.stepShow$)(value => ({ name: 'stepShow', value })), map.bind(this.stepHide$)(value => ({ name: 'stepHide', value })), map.bind(this.initialize$)(value => ({ name: 'initialize', value })), map.bind(this.start$)(value => ({ name: 'start', value })), map.bind(this.end$)(value => ({ name: 'end', value })), map.bind(this.pause$)(value => ({ name: 'pause', value })), map.bind(this.resume$)(value => ({ name: 'resume', value })), map.bind(this.anchorRegister$)(value => ({ name: 'anchorRegister', value })), map.bind(this.anchorUnregister$)(value => ({ name: 'anchorUnregister', value })));
        this.steps = [];
        this.anchors = {};
        this.status = TourState.OFF;
    }
    /**
     * @param {?} steps
     * @param {?=} stepDefaults
     * @return {?}
     */
    initialize(steps, stepDefaults) {
        if (steps && steps.length > 0) {
            this.status = TourState.OFF;
            this.steps = steps.map(step => Object.assign({}, stepDefaults, step));
            this.initialize$.next(this.steps);
        }
    }
    /**
     * @return {?}
     */
    start() {
        this.startAt(0);
    }
    /**
     * @param {?} stepId
     * @return {?}
     */
    startAt(stepId) {
        this.status = TourState.ON;
        this.goToStep(this.loadStep(stepId));
        this.start$.next();
        this.router.events.filter(event => event instanceof NavigationStart).first().subscribe(() => {
            if (this.currentStep) {
                this.hideStep(this.currentStep);
            }
        });
    }
    /**
     * @return {?}
     */
    end() {
        this.status = TourState.OFF;
        this.hideStep(this.currentStep);
        this.currentStep = undefined;
        this.end$.next();
    }
    /**
     * @return {?}
     */
    pause() {
        this.status = TourState.PAUSED;
        this.hideStep(this.currentStep);
        this.pause$.next();
    }
    /**
     * @return {?}
     */
    resume() {
        this.status = TourState.ON;
        this.showStep(this.currentStep);
        this.resume$.next();
    }
    /**
     * @param {?=} pause
     * @return {?}
     */
    toggle(pause) {
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
    }
    /**
     * @return {?}
     */
    next() {
        if (this.hasNext(this.currentStep)) {
            this.goToStep(this.loadStep(this.currentStep.nextStep || this.steps.indexOf(this.currentStep) + 1));
        }
    }
    /**
     * @param {?} step
     * @return {?}
     */
    hasNext(step) {
        if (!step) {
            console.warn('Can\'t get next step. No currentStep.');
            return false;
        }
        return step.nextStep !== undefined || this.steps.indexOf(step) < this.steps.length - 1;
    }
    /**
     * @return {?}
     */
    prev() {
        if (this.hasPrev(this.currentStep)) {
            this.goToStep(this.loadStep(this.currentStep.prevStep || this.steps.indexOf(this.currentStep) - 1));
        }
    }
    /**
     * @param {?} step
     * @return {?}
     */
    hasPrev(step) {
        if (!step) {
            console.warn('Can\'t get previous step. No currentStep.');
            return false;
        }
        return step.prevStep !== undefined || this.steps.indexOf(step) > 0;
    }
    /**
     * @param {?} stepId
     * @return {?}
     */
    goto(stepId) {
        this.goToStep(this.loadStep(stepId));
    }
    /**
     * @param {?} anchorId
     * @param {?} anchor
     * @return {?}
     */
    register(anchorId, anchor) {
        if (this.anchors[anchorId]) {
            throw new Error('anchorId ' + anchorId + ' already registered!');
        }
        this.anchors[anchorId] = anchor;
        this.anchorRegister$.next(anchorId);
    }
    /**
     * @param {?} anchorId
     * @return {?}
     */
    unregister(anchorId) {
        delete this.anchors[anchorId];
        this.anchorUnregister$.next(anchorId);
    }
    /**
     * @return {?}
     */
    getStatus() {
        return this.status;
    }
    /**
     * @param {?} step
     * @return {?}
     */
    goToStep(step) {
        if (!step) {
            console.warn('Can\'t go to non-existent step');
            this.end();
            return;
        }
        let /** @type {?} */ navigatePromise = new Promise(resolve => resolve(true));
        if (step.route !== undefined && typeof (step.route) === 'string') {
            navigatePromise = this.router.navigateByUrl(step.route);
        }
        else if (step.route && Array.isArray(step.route)) {
            navigatePromise = this.router.navigate(step.route);
        }
        navigatePromise.then(navigated => {
            if (navigated !== false) {
                setTimeout(() => this.setCurrentStep(step));
            }
        });
    }
    /**
     * @param {?} stepId
     * @return {?}
     */
    loadStep(stepId) {
        if (typeof (stepId) === 'number') {
            return this.steps[stepId];
        }
        else {
            return this.steps.find(step => step.stepId === stepId);
        }
    }
    /**
     * @param {?} step
     * @return {?}
     */
    setCurrentStep(step) {
        if (this.currentStep) {
            this.hideStep(this.currentStep);
        }
        this.currentStep = step;
        this.showStep(this.currentStep);
        this.router.events.filter(event => event instanceof NavigationStart).first().subscribe(() => {
            if (this.currentStep) {
                this.hideStep(this.currentStep);
            }
        });
    }
    /**
     * @param {?} step
     * @return {?}
     */
    showStep(step) {
        const /** @type {?} */ anchor = this.anchors[step && step.anchorId];
        if (!anchor) {
            this.end();
            return;
        }
        anchor.showTourStep(step);
        this.stepShow$.next(step);
    }
    /**
     * @param {?} step
     * @return {?}
     */
    hideStep(step) {
        const /** @type {?} */ anchor = this.anchors[step && step.anchorId];
        if (!anchor) {
            return;
        }
        anchor.hideTourStep();
        this.stepHide$.next(step);
    }
}
TourService.decorators = [
    { type: Injectable },
];
/**
 * @nocollapse
 */
TourService.ctorParameters = () => [
    { type: Router, },
];

class TourHotkeyListenerComponent {
    /**
     * @param {?} tourService
     */
    constructor(tourService) {
        this.tourService = tourService;
    }
    /**
     * Configures hot keys for controlling the tour with the keyboard
     * @param {?} event
     * @return {?}
     */
    onEscapeKey(event) {
        if (this.tourService.getStatus() === TourState.ON) {
            this.tourService.end();
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    onArrowRightKey(event) {
        if (this.tourService.getStatus() === TourState.ON && this.tourService.hasNext(this.tourService.currentStep)) {
            this.tourService.next();
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    onArrowLeftKey(event) {
        if (this.tourService.getStatus() === TourState.ON && this.tourService.hasPrev(this.tourService.currentStep)) {
            this.tourService.prev();
        }
    }
}
TourHotkeyListenerComponent.decorators = [
    { type: Component, args: [{
                selector: 'tour-hotkey-listener',
                template: ` `,
            },] },
];
/**
 * @nocollapse
 */
TourHotkeyListenerComponent.ctorParameters = () => [
    { type: TourService, },
];
TourHotkeyListenerComponent.propDecorators = {
    'onEscapeKey': [{ type: HostListener, args: ['window:keydown.Escape',] },],
    'onArrowRightKey': [{ type: HostListener, args: ['window:keydown.ArrowRight',] },],
    'onArrowLeftKey': [{ type: HostListener, args: ['window:keydown.ArrowLeft',] },],
};

class TourModule {
    /**
     * @return {?}
     */
    static forRoot() {
        return {
            ngModule: TourModule,
            providers: [
                TourService,
            ],
        };
    }
}
TourModule.decorators = [
    { type: NgModule, args: [{
                declarations: [TourHotkeyListenerComponent],
                exports: [TourHotkeyListenerComponent],
                imports: [CommonModule, RouterModule],
            },] },
];
/**
 * @nocollapse
 */
TourModule.ctorParameters = () => [];

/**
 * Generated bundle index. Do not edit.
 */

export { TourModule, TourService, TourState, TourHotkeyListenerComponent };
//# sourceMappingURL=ngx-tour-core.js.map
