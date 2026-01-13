import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { SupportListComponent } from './support-list.component';
import { SupportTicketComponent } from './support-ticket.component';

const routes: Routes = [
  { path: '', component: SupportListComponent },
  { path: ':ticketId', component: SupportTicketComponent }
];

@NgModule({
  declarations: [
    SupportListComponent,
    SupportTicketComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class SupportModule { }
