import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateUserRequest {
  name: string;
  lastName: string;
  email: string;
  numberPhone: string;
  restriccion: string;
}

export interface User extends CreateUserRequest {
  _id: string;
  confirmation: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  createUser(payload: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, payload);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }
}
