import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-user-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormComponent {
  title = signal('Confirma tu asistencia');
  subtitle = signal('¡Nos encantaría contar con tu presencia! Por favor, confirma tu asistencia para ayudarnos a planificar mejor el evento.');

  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly isSuccessModalOpen = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isOtroSelected = signal(false);

  readonly userForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    numberPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
    restriccion: [''],
    restriccionOtro: [''],
    confirmation: ['', Validators.required],
    message: ['', [Validators.maxLength(200)]]
  });

  constructor() {
    this.userForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.successMessage()) {
        this.successMessage.set(null);
        this.isSuccessModalOpen.set(false);
      }
    });

    this.userForm.controls.confirmation.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.toggleAttendanceDependentFields(value === 'false'));

    this.userForm.controls.restriccion.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.isOtroSelected.set(value === 'Otro' && !this.userForm.controls.restriccion.disabled));

    this.toggleAttendanceDependentFields(this.userForm.controls.confirmation.value === 'false');
  }

  closeSuccessPopup(): void {
    this.isSuccessModalOpen.set(false);
    this.successMessage.set(null);
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    const { confirmation, restriccionOtro, ...rest } = this.userForm.getRawValue();
    const isAttending = confirmation === 'true';
    const restriccion = isAttending
      ? (rest.restriccion === 'Otro' ? (restriccionOtro.trim() || 'Otro') : rest.restriccion)
      : '';
    const payload = {
      ...rest,
      email: isAttending ? rest.email : '',
      numberPhone: isAttending ? rest.numberPhone : '',
      message: isAttending ? rest.message : '',
      restriccion,
      confirmation: isAttending
    };

    this.usersService
      .createUser(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.userForm.reset({
            name: '',
            lastName: '',
            email: '',
            numberPhone: '',
            restriccion: '',
            restriccionOtro: '',
            confirmation: '',
            message: ''
          }, { emitEvent: false });
          this.toggleAttendanceDependentFields(false);
          this.isOtroSelected.set(false);
          this.successMessage.set('Registro enviado correctamente.');
          this.isSuccessModalOpen.set(true);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 0) {
            this.errorMessage.set(
              'Error intenta más tarde'
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

  private toggleAttendanceDependentFields(disableFields: boolean): void {
    const controls = [
      this.userForm.controls.email,
      this.userForm.controls.numberPhone,
      this.userForm.controls.restriccion,
      this.userForm.controls.restriccionOtro,
      this.userForm.controls.message
    ];

    controls.forEach(control => {
      if (disableFields) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    });

    this.isOtroSelected.set(!disableFields && this.userForm.controls.restriccion.value === 'Otro');
  }
}
