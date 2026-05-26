/**
 * PetNameCircle - 圆形文字头像组件
 *
 * 当宠物没有照片时，显示名字首字的圆形渐变背景头像。
 * 支持任意尺寸，自动计算字体大小。
 */
function PetNameCircle({ name, size = 120 }: { name: string; size?: number }) {
  const char = (name || "宠").charAt(0).toUpperCase();
  return (
    <span
      className="pet-name-circle"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        lineHeight: `${size}px`,
      }}
      title={name}
    >
      {char}
    </span>
  );
}

export default PetNameCircle;
