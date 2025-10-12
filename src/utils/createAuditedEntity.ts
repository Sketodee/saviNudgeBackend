import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { IAuditedEntity } from '../types/appScopeTypes';

export function createAuditedEntity<T>(
  data: T,
  createdBy: string = 'system'
): T & IAuditedEntity {
  return {
    ...data,
    created_by: createdBy,
    created_on: FieldValue.serverTimestamp() as any,
    updated_by: null,
    updated_on: null,
    deleted_by: null,
    deleted_on: null,
    is_deleted: false,
  };
}

export function updateAuditedEntity<T>(
  data: T,
  updatedBy: string
): Partial<T> & Pick<IAuditedEntity, 'updated_by' | 'updated_on'> {
  return {
    ...data,
    updated_by: updatedBy,
    updated_on: FieldValue.serverTimestamp() as any,
  };
}

export function softDeleteEntity(
  deletedBy: string
): Pick<IAuditedEntity, 'deleted_by' | 'deleted_on' | 'is_deleted'> {
  return {
    is_deleted: true,
    deleted_by: deletedBy,
    deleted_on: FieldValue.serverTimestamp() as any,
  };
}