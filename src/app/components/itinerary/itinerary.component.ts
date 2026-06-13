import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-itinerary',
  imports: [],
  templateUrl: './itinerary.component.html',
})
export class ItineraryComponent {
  title = signal('Itinerario');
  subtitle = signal('Organizate con tiempo para no perderte ningun momento especial.');
}
