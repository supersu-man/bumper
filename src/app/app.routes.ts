import { Routes } from '@angular/router';
import { UpdateWindowComponent } from './update-window/update-window.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    { path: "", component: HomeComponent },
    { path: "testing", component: UpdateWindowComponent }
];