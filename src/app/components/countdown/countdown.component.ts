import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-countdown',
  imports: [],
  templateUrl: './countdown.component.html',
})
export class CountdownComponent {
  title = signal('¡La cuenta regresiva ha comenzado!');
  subtitle = signal('Estamos emocionados de compartir este momento contigo. ¡Faltan pocos días para la gran celebración!');
}
