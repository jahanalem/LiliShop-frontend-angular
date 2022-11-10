export const pattern = {
  EMAIL: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
  /*
    At least one upper case English letter, (?=.*?[A-Z])
    At least one lower case English letter, (?=.*?[a-z])
    At least one digit, (?=.*?[0-9])
    At least one special character, (?=.*?[#?!@$%^&*-])
    Minimum six in length .{6,} (with the anchors)
    https://stackoverflow.com/a/19605207/1817640
  */
  PASSWORD: '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$',
};
Object.freeze(pattern);
