import { COLORS } from '../tokens';

export default function Divider({ style: s }) {
  return <div style={{ width: '100%', height: 1, background: COLORS.border, ...s }} />;
}
