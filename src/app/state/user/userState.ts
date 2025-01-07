export interface IUser {
  _id?: string;
  name: string;
  email: string;
  imageUrl?: string; 
  password?: string;
  isVerified?: boolean;
  isBlocked?: boolean;
  isAdmin?: boolean;
}  

 export interface OtpResponse {
  success: boolean;
  message?: string;
  token?: string;
}

export interface IComment {
  userId: string;
  comment: string;
  likes: number;
}

export interface IBlog {
  _id: string;
  title: string;
  imageUrl: string;
  content: string;
  author: string;
  authorId: string;
  likes: number;
  bookmarks: string[];
  comments: IComment[];
  createdAt: Date;
}
