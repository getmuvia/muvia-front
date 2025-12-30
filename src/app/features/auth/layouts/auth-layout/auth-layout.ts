import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-auth-layout',
    imports: [RouterOutlet],
    template: `
    <div class="min-h-screen w-full bg-background-light dark:bg-background-dark">
      <router-outlet />
    </div>
  `
})
export class AuthLayout { }
