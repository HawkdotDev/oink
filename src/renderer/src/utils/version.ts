import pkg from '../../../../package.json'

export const APP_VERSION: string = pkg.version
export const APP_NAME: string = pkg.displayName || pkg.name || 'Oink'
