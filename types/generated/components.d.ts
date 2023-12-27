import type { Schema, Attribute } from '@strapi/strapi';

export interface ProfileAdminProfile extends Schema.Component {
  collectionName: 'components_profile_admin_profiles';
  info: {
    displayName: 'adminProfile';
    icon: 'crown';
  };
  attributes: {
    firstName: Attribute.String;
    lastName: Attribute.String;
    avatar: Attribute.Media;
  };
}

export interface ProfileClientProfile extends Schema.Component {
  collectionName: 'components_profile_client_profiles';
  info: {
    displayName: 'clientProfile';
    icon: 'user';
  };
  attributes: {
    address: Attribute.String;
    role: Attribute.String;
    telegram: Attribute.String;
    avatar: Attribute.Media;
    firstName: Attribute.String;
    lastName: Attribute.String;
  };
}

export interface ProfileWorkerProfile extends Schema.Component {
  collectionName: 'components_profile_worker_profiles';
  info: {
    displayName: 'workerProfile';
    icon: 'emotionHappy';
    description: '';
  };
  attributes: {
    firstName: Attribute.String;
    lastName: Attribute.String;
    avatar: Attribute.Media;
    isActive: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'profile.admin-profile': ProfileAdminProfile;
      'profile.client-profile': ProfileClientProfile;
      'profile.worker-profile': ProfileWorkerProfile;
    }
  }
}
