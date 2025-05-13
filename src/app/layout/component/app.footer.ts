import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `
    <div class="layout-footer">
        <div class="footer-logo-container">
            <img alt="ERRE CORPORATION S.R.L." src="assets/images/logo/errecorporation-logo.png">
            <span class="footer-app-name">Erre Corporation</span>
        </div>
        <span class="footer-copyright">© ERRE CORPORATION S.R.L. - {{year}}</span>
    </div>
    `
})
export class AppFooter {
    year = new Date().getFullYear();
}
