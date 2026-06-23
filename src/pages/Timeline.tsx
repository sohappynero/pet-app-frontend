import GlassNav from "../components/petos/GlassNav";

export default function Timeline() {
  return (
    <div className="petos-page">
      <div className="petos-content">
        <GlassNav />
        <div className="petos-greet">
          <div className="petos-greet__name">成长</div>
        </div>
        <div className="petos-empty-state">
          <div className="petos-empty-state__icon" aria-hidden="true">📖</div>
          <h2 className="petos-empty-state__title">成长档案</h2>
          <p className="petos-empty-state__desc">正在筹备中，敬请期待</p>
        </div>
      </div>
    </div>
  );
}
