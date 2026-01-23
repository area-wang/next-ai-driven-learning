---
inclusion: always
---
<!------------------------------------------------------------------------------------
   Add rules to this file or a short description and have Kiro refine them for you.
   
   Learn about inclusion modes: https://kiro.dev/docs/steering/#inclusion-modes
-------------------------------------------------------------------------------------> 

node版本用20，node版本切换工具nvm

当开发完任务，每次要验证的时候，先执行npx tsc --noEmit 看是否有类型报错，再npm run preview 看是否编译报错

对某个功能和某个bug的文档的说明统一放到一个md文档里，不要分散，不要每次做完一个功能或者修复一个bug，就新开一个md文档记录，在原来的md文档上补充就行，不然会有很多的md文档太分散了