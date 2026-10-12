import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [TranslatePipe, NgOptimizedImage, RouterOutlet],
  templateUrl: './auth-layout.html',
})
export class AuthLayout { }
