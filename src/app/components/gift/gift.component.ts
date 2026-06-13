import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-gift',
  imports: [],
  templateUrl: './gift.component.html',
})
export class GiftComponent {
  title = signal('¿Quieres hacernos un regalo?');
  subtitle = signal('Tu presencia es el mejor regalo que podríamos pedir. Sin embargo, si deseas contribuir a nuestro fondo para la luna de miel, aquí tienes algunas opciones que hemos preparado con cariño. ¡Gracias por ser parte de este momento tan especial en nuestras vidas!');
}
