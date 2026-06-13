import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-start',
  imports: [],
  templateUrl: './start.component.html',
})
export class StartComponent {
  title = signal('Invitacion de boda');
  subtitle = signal('María José y Gonzalo');
  subtitle2 = signal('Estamos emocionados de compartir este momento tan especial con ustedes. ¡Gracias por ser parte de nuestra historia!');
}
