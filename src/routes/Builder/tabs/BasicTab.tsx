import type { ChangeEvent, RefObject } from 'react';
import { CompactInput } from '../FormInputs';
import type { BasicInfo } from '../useBuilderForm';
import { InlineButton } from './shared';

interface BasicTabProps {
  basicInfo: BasicInfo;
  photo?: string;
  photoInputRef: RefObject<HTMLInputElement>;
  onPhotoUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onPhotoClear: () => void;
  onUpdateBasicInfo: (field: keyof BasicInfo, value: string) => void;
}

export function BasicTab({
  basicInfo,
  photo,
  photoInputRef,
  onPhotoUpload,
  onPhotoClear,
  onUpdateBasicInfo,
}: BasicTabProps) {
  return (
    <div className="space-y-3">
      {/* 照片区域 - 顶部居中 */}
      <div className="flex justify-center">
        <div className="text-center">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={onPhotoUpload}
            className="hidden"
          />
          <div
            onClick={() => photoInputRef.current?.click()}
            className="w-20 h-24 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-teal-500/40 hover:bg-teal-500/5 transition-all overflow-hidden mx-auto group"
          >
            {photo ? (
              <img src={photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <span className="text-gray-600 text-2xl group-hover:text-teal-400 transition-colors">📷</span>
                <p className="text-xs text-gray-600 mt-1">上传照片</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {photo ? (
              <InlineButton
                tone="danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onPhotoClear();
                }}
              >
                删除照片
              </InlineButton>
            ) : (
              '支持 JPG、PNG，不超过 2MB'
            )}
          </p>
        </div>
      </div>
      {/* 基本信息表单 */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <CompactInput
            label="姓名"
            value={basicInfo.name || ''}
            onChange={(value) => onUpdateBasicInfo('name', value)}
            placeholder="张三"
          />
          <CompactInput
            label="求职意向"
            value={basicInfo.jobTitle || ''}
            onChange={(value) => onUpdateBasicInfo('jobTitle', value)}
            placeholder="Java开发"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CompactInput
            label="手机"
            value={basicInfo.phone}
            onChange={(value) => onUpdateBasicInfo('phone', value)}
            placeholder="138xxxx"
          />
          <CompactInput
            label="邮箱"
            value={basicInfo.email}
            onChange={(value) => onUpdateBasicInfo('email', value)}
            placeholder="email"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CompactInput
            label="状态"
            value={basicInfo.status || ''}
            onChange={(value) => onUpdateBasicInfo('status', value)}
            placeholder="在职/应届"
          />
          <CompactInput
            label="城市"
            value={basicInfo.city || ''}
            onChange={(value) => onUpdateBasicInfo('city', value)}
            placeholder="北京"
          />
        </div>
      </div>
      <details className="text-xs">
        <summary className="text-teal-500 cursor-pointer hover:text-teal-400 font-medium py-1">+ 更多信息</summary>
        <div className="mt-2 space-y-2 pt-2 border-t border-white/[0.06]">
          <CompactInput
            label="GitHub"
            value={basicInfo.github || ''}
            onChange={(value) => onUpdateBasicInfo('github', value)}
            placeholder="github.com/xxx"
          />
          <CompactInput
            label="网站"
            value={basicInfo.website || ''}
            onChange={(value) => onUpdateBasicInfo('website', value)}
            placeholder="yoursite.com"
          />
          <CompactInput
            label="籍贯"
            value={basicInfo.hometown || ''}
            onChange={(value) => onUpdateBasicInfo('hometown', value)}
            placeholder="广东"
          />
        </div>
      </details>
    </div>
  );
}
