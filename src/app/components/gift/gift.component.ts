import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-gift',
  imports: [],
  templateUrl: './gift.component.html',
})
export class GiftComponent {
  title = signal('¿Quieres hacernos un regalo?');
  subtitle = signal('Tu presencia es el mejor regalo que podríamos pedir. Sin embargo, si deseas contribuir a nuestro fondo para la luna de miel, aquí tienes nuestras opciones de transferencia.');

  bankAccount = signal({
    bank: 'Banco Estado',
    accountHolder: 'Camila Gonzalez',
    accountNumber: '12345678-9',
    email: 'camilagonzalez@email.com'
  });
}
