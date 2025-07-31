export interface LiveComment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export const liveComments: LiveComment[] = [
  {
    id: "c1",
    userId: "user5",
    username: "sarah_j",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    text: "Love this content! 💕",
    timestamp: "Just now"
  },
  {
    id: "c2",
    userId: "user6",
    username: "mike_t",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    text: "Where are you right now?",
    timestamp: "30s ago"
  },
  {
    id: "c3",
    userId: "user7",
    username: "fitness_lover",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    text: "Can you show that again please?",
    timestamp: "1m ago"
  },
  {
    id: "c4",
    userId: "user8",
    username: "travel_addict",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    text: "Wow! Amazing view! 😍",
    timestamp: "2m ago"
  },
  {
    id: "c5",
    userId: "user9",
    username: "cooking_pro",
    avatar: "https://images.unsplash.com/photo-1546456073-92b9f0a8d413?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
    text: "What ingredients are you using?",
    timestamp: "3m ago"
  }
];