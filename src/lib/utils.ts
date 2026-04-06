export const formatVND = (n: number) => {
  return n.toLocaleString('vi-VN') + ' ₫';
};

export const formatAccount = (s: string) => {
  return s.replace(/(\d{4})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
};

export const formatDate = (d: string | Date) => {
  return new Date(d).toLocaleDateString('vi-VN');
};
