import type { PetType, PostType } from "../types/models";

export type RootStackParamList = {
  Tabs: undefined;
  PostDetails: { postId: string };
  Settings: undefined;
  Matches: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Guardian: undefined;
  Create: undefined;
  Vault: undefined;
  Profile: undefined;
};

export type CreateStackParamList = {
  ModeSelect: undefined;
  CreatePostWizard: {
    type: PostType;
    petType: PetType;
  };
};
