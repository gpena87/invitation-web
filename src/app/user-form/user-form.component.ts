import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { UsersService } from '../services/users.service';

@Component({
  selector: 'app-user-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly userForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    numberPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
    restriccion: ['']
  });

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const payload = this.userForm.getRawValue();

    this.usersService
      .createUser(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Registro enviado correctamente.');
          this.userForm.reset({
            name: '',
            lastName: '',
            email: '',
            numberPhone: '',
            restriccion: ''
          });
        },
        error: (error: HttpErrorResponse) => {
          console.log('error', error);
          if (error.status === 0) {
            this.errorMessage.set(
              'No se pudo conectar con la API. Si estas en desarrollo, inicia la app con ng serve para usar el proxy.'
            );
            return;
          }

          const apiMessage =
            typeof error.error === 'object' && error.error !== null && 'message' in error.error
              ? String(error.error.message)
              : null;

          this.errorMessage.set(apiMessage ?? 'No se pudo enviar el formulario. Intentalo nuevamente.');
        }
      });
  }
}
