import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule],
    template: `
    <div class="col-span-12 lg:col-span-6 xl:col-span-6">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Ultima Retribuzione netta</span>
                    <div class="dark:text-surface-0 font-medium text-xl text-primary" *ngIf="!show"><i class="pi pi-euro"></i> **.***,**</div>
                    <div class="dark:text-surface-0 font-medium text-xl text-primary" *ngIf="show"><i class="pi pi-euro"></i> 2.341,00</div>
                </div>
                <div class="flex items-center justify-center bg-primary-100 dark:bg-primary-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-euro text-primary !text-xl"></i>
                </div>
            </div>
            <p><i class="text-green-500 pi pi-arrow-up text-green"></i> 5,00 <i class="pi pi-percentage"></i> dell'ultima retribuzione</p>
            <p class="text-muted-color">Maggio 2025</p>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-6 text-right">
        <a (click)="onToggle()" class="pointer text-primary">
            <i class="pi pi-eye" *ngIf="!show"></i>
            <i class="pi pi-eye-slash" *ngIf="show"></i>
            &nbsp;
            <span *ngIf="!show">Mostra</span>
            <span *ngIf="show">Nascondi</span>
        </a>
    </div>
    `
})
export class StatsWidget {
    show: boolean = false;

    onToggle() {
        this.show = !this.show;
    }
}
