import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-maps',
  imports: [],
  templateUrl: './maps.component.html',
})
export class MapsComponent {
  title = signal('Ceremonia');
  addressDetail = signal('Av. Las Condes 9700, Las Condes, Santiago de Chile');
  addressDescription = signal('Parroquia Santa Maria de Las Condes');
  addressLink = signal('https://maps.app.goo.gl/BZm533e8FkiRVdYp7');
}
