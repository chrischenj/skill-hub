import { Link } from 'react-router-dom';
import StarCount from './StarCount';

const categoryLabels = {
  approval: '审批', attendance: '考勤', base: '多维表格', calendar: '日历',
  contact: '通讯录', doc: '文档', drive: '云空间', im: '即时通讯',
  mail: '邮箱', minutes: '妙记', wiki: '知识库', okr: 'OKR',
  task: '任务', vc: '会议', whiteboard: '画板', sheets: '电子表格',
  slides: '幻灯片', 'skill-maker': 'Skill 开发', markdown: 'Markdown',
  agent: 'Agent', uncategorized: '其他',
};

const categoryColors = {
  approval: 'bg-blue-50 text-blue-600',
  base: 'bg-green-50 text-green-600',
  calendar: 'bg-orange-50 text-orange-600',
  doc: 'bg-indigo-50 text-indigo-600',
  im: 'bg-sky-50 text-sky-600',
  mail: 'bg-rose-50 text-rose-600',
  task: 'bg-amber-50 text-amber-600',
  vc: 'bg-violet-50 text-violet-600',
  okr: 'bg-emerald-50 text-emerald-600',
  wiki: 'bg-teal-50 text-teal-600',
  default: 'bg-gray-50 text-gray-600',
};

export default function SkillCard({ skill }) {
  const { id, name, description, stars, category, language, metadata } = skill;
  const m = metadata || {};
  const catColor = categoryColors[category] || categoryColors.default;
  const catLabel = categoryLabels[category] || category;

  return (
    <Link
      to={`/skills/${encodeURIComponent(id)}`}
      className="card card-hover block p-5 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {m.owner_avatar ? (
            <img src={m.owner_avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-pink/20 to-accent-purple/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-accent-purple">
                {name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-figma-black truncate group-hover:text-accent-purple transition-colors">
              {name}
            </h3>
            {language && (
              <span className="text-xs text-figma-gray">{language}</span>
            )}
          </div>
        </div>
        <StarCount count={stars} />
      </div>

      <p className="text-sm text-figma-gray line-clamp-2 mb-3 leading-relaxed min-h-[2.5rem]">
        {description || 'No description'}
      </p>

      {category && category !== 'uncategorized' && (
        <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${catColor}`}>
          {catLabel}
        </span>
      )}
    </Link>
  );
}

export { categoryLabels, categoryColors };
