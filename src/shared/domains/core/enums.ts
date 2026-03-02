/**
 * ENUM для core домена
 */

export enum ContainerError {
  CIRCULAR_DEPENDENCY = 'Circular dependency detected',
  SERVICE_NOT_REGISTERED = 'Service not registered',
  SERVICE_CREATION_FAILED = 'Service creation failed'
}
