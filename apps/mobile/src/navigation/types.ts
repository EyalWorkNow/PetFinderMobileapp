import type { PetType, PostType } from "../types/models";

export type RootStackParamList = {
  Tabs: undefined;
  PostDetails: { postId: string };
};

export type MainTabParamList = {
  Map: undefined;
  Create: undefined;
  Matches: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type CreateStackParamList = {
  ModeSelect: undefined;
  CreatePostWizard: {
    type: PostType;
    petType: PetType;
  };
};
